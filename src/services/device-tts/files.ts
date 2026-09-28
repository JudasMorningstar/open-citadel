/**
 * Kokoro's files on this device: fetching them, finding them.
 *
 * Same contract as `device-llm/files.ts` (see that file for the reasoning):
 * ExecuTorch's `download` owns the cache, so the app only ever asks the disk
 * directly whether a file `download` would use is already there, and never
 * calls `download` speculatively.
 *
 * Unlike an `LLMModel`, a `KokoroTtsModel`'s URLs are nested at different
 * depths (`modelPaths.durationPredictor`, `phonemizer.neuralModelSource`,
 * `voices.<name>`) and the voice set varies by language, so the file list is
 * collected by walking the object rather than a fixed set of keys.
 */

import RNBlobUtil from 'react-native-blob-util';
import type { KokoroTtsModel } from 'react-native-executorch';

import { cachePath, getExecuTorch } from '@/lib/executorch';
import { kokoroModels, type KokoroAccent } from '@/services/device-tts/catalogue';

/** Every remote URL nested inside a Kokoro model config, in no particular order. */
function collectUrls(value: unknown): string[] {
  if (typeof value === 'string') return value.startsWith('http') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectUrls);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectUrls);
  return [];
}

/**
 * Every URL Kokoro needs, across both accents. The two share their weights, so
 * the list is deduplicated: the second accent only adds a phonemizer and its
 * voices.
 */
export function remoteUrls(): string[] {
  const models = kokoroModels();
  return models ? [...new Set(collectUrls(models))] : [];
}

/** Fetches every file Kokoro needs. Rejects with `DOWNLOAD_ABORTED` when `signal` fires. */
export async function downloadModelFiles(options: {
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}): Promise<void> {
  const et = getExecuTorch();
  const models = kokoroModels();
  if (!et || !models) throw new Error("On-device voices aren't supported on this device.");
  // One call for both accents, so progress is weighted across every file
  // and the shared weights are fetched once.
  await et.download(models, options);
}

/**
 * One accent's Kokoro files on this device, or null when any file of either
 * accent is missing.
 *
 * Checks both accents so a half-finished or older, US-only download reads as
 * not downloaded rather than failing later on the first British voice. Never
 * touches the network — see `device-llm/files.ts`'s identical note.
 */
export async function localModelFiles(accent: KokoroAccent): Promise<KokoroTtsModel<string> | null> {
  const et = getExecuTorch();
  const models = kokoroModels();
  if (!et || !models) return null;

  const present = await Promise.all(remoteUrls().map((url) => RNBlobUtil.fs.exists(cachePath(url)).catch(() => false)));
  if (!present.every(Boolean)) return null;

  try {
    return await et.download(models[accent]);
  } catch {
    return null;
  }
}
