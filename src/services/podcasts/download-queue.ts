/**
 * The download queue: two at a time, with progress reported at most four
 * times a second per download. In memory; `resumeInterruptedDownloads` picks
 * up what a closed app left behind.
 */
import { eq } from "drizzle-orm";
import { createDownloadResumable, deleteAsync, getInfoAsync, type DownloadResumable } from "expo-file-system/legacy";

import { db } from "@/db/client";
import { podcastEpisodes } from "@/db/schema";
import { ensureFolder, fileNameFor, folderUri, setStatus } from "@/services/podcasts/download-files";
import { nowIso } from "@/services/podcasts/records";
import { usePodcastDownloads } from "@/stores/podcast-downloads";
import { invalidatePodcastLibrary } from "@/query-manager/podcasts/invalidate";

const CONCURRENCY = 2;
/** Progress is reported at most this often per download. */
const PROGRESS_INTERVAL_MS = 250;

const waiting: string[] = [];
const running = new Map<string, DownloadResumable>();
const cancelled = new Set<string>();

/** How a download ended. */
export type DownloadOutcome = "downloaded" | "failed" | "cancelled";
type SettleListener = (id: string, outcome: DownloadOutcome) => void;
const listeners = new Set<SettleListener>();

/** Hears every download end, however it ended. Returns the unsubscribe. */
export function onDownloadSettled(listener: SettleListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function settle(id: string, outcome: DownloadOutcome): void {
  for (const listener of listeners) {
    // One listener failing is its own problem, not the queue's or the next listener's.
    try {
      listener(id, outcome);
    } catch {}
  }
}

/** Whether an episode is waiting for, or in the middle of, a download. */
export function isPending(id: string): boolean {
  return waiting.includes(id) || running.has(id);
}

async function runOne(id: string): Promise<DownloadOutcome> {
  const rows = await db
    .select({
      id: podcastEpisodes.id,
      audioUrl: podcastEpisodes.audioUrl,
      mimeType: podcastEpisodes.mimeType,
    })
    .from(podcastEpisodes)
    .where(eq(podcastEpisodes.id, id))
    .limit(1);
  const episode = rows[0];
  if (!episode) return "failed";

  const name = fileNameFor(episode);
  const target = `${folderUri()}${name}`;
  const store = usePodcastDownloads.getState();
  let lastReport = 0;
  const task = createDownloadResumable(episode.audioUrl, target, {}, (p) => {
    const now = Date.now();
    if (now - lastReport < PROGRESS_INTERVAL_MS || p.totalBytesExpectedToWrite <= 0) return;
    lastReport = now;
    store.setProgress(id, p.totalBytesWritten / p.totalBytesExpectedToWrite);
  });
  running.set(id, task);
  await setStatus([id], { downloadStatus: "downloading", downloadError: null });
  store.setProgress(id, 0);
  invalidatePodcastLibrary();

  try {
    await ensureFolder();
    const result = await task.downloadAsync();
    if (cancelled.has(id)) return "cancelled";
    if (!result || result.status >= 400) {
      throw new Error(result ? `The server refused the download (error ${result.status}).` : "The download stopped.");
    }
    const info = await getInfoAsync(target);
    await setStatus([id], {
      downloadStatus: "downloaded",
      downloadFile: name,
      downloadedAt: nowIso(),
      ...(info.exists && info.size ? { fileSize: info.size } : {}),
    });
    return "downloaded";
  } catch (err) {
    if (cancelled.has(id)) return "cancelled";
    await deleteAsync(target, { idempotent: true }).catch(() => {});
    await setStatus([id], {
      downloadStatus: "failed",
      downloadError: err instanceof Error ? err.message : "The download failed.",
    });
    return "failed";
  } finally {
    running.delete(id);
    cancelled.delete(id);
    store.clear(id);
    invalidatePodcastLibrary();
  }
}

function pump(): void {
  while (running.size < CONCURRENCY && waiting.length > 0) {
    const id = waiting.shift()!;
    void runOne(id)
      .catch((): DownloadOutcome => "failed")
      .then((outcome) => settle(id, outcome))
      .finally(pump);
  }
}

/** Adds episodes to the back of the queue and starts what there is room for. */
export function startDownloads(ids: string[]): void {
  waiting.push(...ids);
  pump();
}

/** Takes episodes out of the queue, and stops any already downloading. */
export async function cancelDownloads(ids: string[]): Promise<void> {
  for (const id of ids) {
    const index = waiting.indexOf(id);
    if (index >= 0) {
      waiting.splice(index, 1);
      settle(id, "cancelled");
    }
    const task = running.get(id);
    if (task) {
      cancelled.add(id);
      await task.cancelAsync().catch(() => {});
    }
  }
}
