/**
 * Kokoro's download state: whether the reader's voice pack is on this
 * device, or downloading.
 *
 * Loading the engine into memory is not this store's job — the reader's
 * synthesis bridge (`use-kokoro-tts-bridge.ts`) calls `device-tts/engine.ts`
 * directly and lazily, the same way a chat turn wakes the LLM only when one
 * is actually sent. There is no separate "wake the voice" moment to hold
 * state for.
 */
import { eq } from "drizzle-orm";
import { getFreeDiskStorageAsync } from "expo-file-system/legacy";
import { create } from "zustand";

import { db } from "@/db/client";
import { appSettings } from "@/db/schema";
import { totalSizeBytes } from "@/services/huggingface";
import { downloadModelFiles, remoteUrls } from "@/services/device-tts/files";
import { formatBytes } from "@/utils/format";

// v2: the pack grew British voices. Anyone who downloaded the US-only pack sees
// the download card once more, and only the new files are fetched.
const IS_DOWNLOADED_KEY = "tts.kokoro.isDownloaded.v2";

interface TtsStore {
  isDownloaded: boolean;
  /** 0-1 while downloading, null otherwise. */
  downloadProgress: number | null;
  loadError: string | null;

  loadState(): Promise<void>;
  downloadModel(): Promise<void>;
  cancelDownload(): void;
}

/** The in-flight download, so a second call can cancel it. Not state: nothing renders off it. */
let download: AbortController | null = null;

function saveSetting(key: string, value: string) {
  db.insert(appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: appSettings.key, set: { value } })
    .run();
}

export const useTtsStore = create<TtsStore>((set) => ({
  isDownloaded: false,
  downloadProgress: null,
  loadError: null,

  async loadState() {
    const row = db.select().from(appSettings).where(eq(appSettings.key, IS_DOWNLOADED_KEY)).get();
    set({ isDownloaded: row?.value === "1" });
  },

  async downloadModel() {
    if (download) return;

    const required = await totalSizeBytes(remoteUrls()).catch(() => null);
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
      saveSetting(IS_DOWNLOADED_KEY, "1");
      set({ isDownloaded: true });
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
}));
