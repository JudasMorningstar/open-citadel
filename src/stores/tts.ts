/**
 * Kokoro's download state: whether the reader's voice pack is on this device,
 * downloading, or loaded.
 *
 * Mirrors `stores/model.ts`'s download lifecycle, trimmed to one fixed entry —
 * there is no catalogue of swappable voices to list, no active-model switch,
 * so no `deviceModels`-style table either. `appSettings` rows are enough to
 * remember whether it's downloaded.
 */
import { eq } from "drizzle-orm";
import { getFreeDiskStorageAsync } from "expo-file-system/legacy";
import { create } from "zustand";

import { db } from "@/db/client";
import { appSettings } from "@/db/schema";
import { totalSizeBytes } from "@/services/huggingface";
import {
  deleteModelFiles,
  downloadModelFiles,
  localModelFiles,
  remoteUrls,
} from "@/services/device-tts/files";
import { loadEngine, unloadEngine } from "@/services/device-tts/engine";
import { formatBytes } from "@/utils/format";

const IS_DOWNLOADED_KEY = "tts.kokoro.isDownloaded";
const DOWNLOADED_AT_KEY = "tts.kokoro.downloadedAt";

interface TtsStore {
  isDownloaded: boolean;
  downloadedAt: string | null;
  sizeBytes: number | null;
  /** 0-1 while downloading, null otherwise. */
  downloadProgress: number | null;
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;

  loadState(): Promise<void>;
  measureSize(): Promise<void>;
  downloadModel(): Promise<void>;
  cancelDownload(): void;
  deleteModel(): Promise<void>;
  initEngine(): Promise<void>;
  releaseEngine(): Promise<void>;
}

/** The in-flight download, so a second call can cancel it. Not state: nothing renders off it. */
let download: AbortController | null = null;
/** The wake in flight, shared so concurrent callers get the same load. */
let waking: Promise<void> | null = null;

function saveSetting(key: string, value: string) {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}

export const useTtsStore = create<TtsStore>((set, get) => ({
  isDownloaded: false,
  downloadedAt: null,
  sizeBytes: null,
  downloadProgress: null,
  isLoaded: false,
  isLoading: false,
  loadError: null,

  async loadState() {
    const rows = db.select().from(appSettings).all();
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    set({
      isDownloaded: map[IS_DOWNLOADED_KEY] === "1",
      downloadedAt: map[DOWNLOADED_AT_KEY] ?? null,
    });
  },

  async measureSize() {
    if (get().sizeBytes != null) return;
    const sizeBytes = await totalSizeBytes(remoteUrls()).catch(() => null);
    if (sizeBytes != null) set({ sizeBytes });
  },

  async downloadModel() {
    if (download) return;

    let required = get().sizeBytes;
    if (required == null) {
      required = await totalSizeBytes(remoteUrls()).catch(() => null);
      if (required != null) set({ sizeBytes: required });
    }
    const freeSpace = await getFreeDiskStorageAsync();
    if (required && freeSpace < required * 1.1) {
      set({ loadError: `Not enough storage. ${formatBytes(required)} required, ${formatBytes(freeSpace)} free.` });
      return;
    }

    const controller = new AbortController();
    download = controller;
    set({ downloadProgress: 0, loadError: null });

    try {
      await downloadModelFiles({
        signal: controller.signal,
        onProgress: (fraction) => set({ downloadProgress: fraction }),
      });

      const now = new Date().toISOString();
      saveSetting(IS_DOWNLOADED_KEY, "1");
      saveSetting(DOWNLOADED_AT_KEY, now);
      set({ isDownloaded: true, downloadedAt: now });
    } catch (err: unknown) {
      // A cancel is the reader's own choice, not a failure worth a message.
      if (!controller.signal.aborted) {
        const msg = err instanceof Error ? err.message : "Download failed";
        set({ loadError: `Download failed: ${msg}` });
      }
    } finally {
      download = null;
      set({ downloadProgress: null });
    }
  },

  cancelDownload() {
    // What arrived so far is kept, so downloading it again carries on from there.
    download?.abort();
  },

  async deleteModel() {
    if (!get().isDownloaded) return;
    if (get().isLoaded) {
      unloadEngine();
      set({ isLoaded: false });
    }
    await deleteModelFiles();
    db.delete(appSettings).where(eq(appSettings.key, IS_DOWNLOADED_KEY)).run();
    db.delete(appSettings).where(eq(appSettings.key, DOWNLOADED_AT_KEY)).run();
    set({ isDownloaded: false, downloadedAt: null });
  },

  initEngine() {
    if (!waking) {
      waking = wake().finally(() => {
        waking = null;
      });
    }
    return waking;
  },

  async releaseEngine() {
    unloadEngine();
    set({ isLoaded: false, loadError: null });
  },
}));

async function wake(): Promise<void> {
  const { getState: get, setState: set } = useTtsStore;
  if (get().isLoaded) return;
  if (!get().isDownloaded) {
    set({ loadError: "The reading voice isn't downloaded." });
    return;
  }

  set({ isLoading: true, loadError: null });
  try {
    const files = await localModelFiles();
    if (!files) {
      db.delete(appSettings).where(eq(appSettings.key, IS_DOWNLOADED_KEY)).run();
      db.delete(appSettings).where(eq(appSettings.key, DOWNLOADED_AT_KEY)).run();
      set({
        isDownloaded: false,
        downloadedAt: null,
        isLoading: false,
        loadError: "The reading voice's files are missing. Download it again.",
      });
      return;
    }
    await loadEngine();
    set({ isLoaded: true, isLoading: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load the reading voice";
    set({ isLoading: false, isLoaded: false, loadError: msg });
  }
}
