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
import { kokoroModel, type KokoroVoice } from '@/services/device-tts/catalogue';

/** Every remote URL nested inside a Kokoro model config, in no particular order. */
function collectUrls(value: unknown): string[] {
  if (typeof value === 'string') return value.startsWith('http') ? [value] : [];
  if (Array.isArray(value)) return value.flatMap(collectUrls);
  if (value && typeof value === 'object') return Object.values(value).flatMap(collectUrls);
  return [];
}

/** Every URL the Kokoro model needs. */
export function remoteUrls(): string[] {
  const model = kokoroModel();
  return model ? collectUrls(model) : [];
}

/** Fetches every file Kokoro needs. Rejects with `DOWNLOAD_ABORTED` when `signal` fires. */
export async function downloadModelFiles(options: {
  onProgress: (fraction: number) => void;
  signal: AbortSignal;
}): Promise<void> {
  const et = getExecuTorch();
  const model = kokoroModel();
  if (!et || !model) throw new Error("On-device voices aren't supported on this device.");
  await et.download(model, options);
}

/**
 * Kokoro's files on this device, or null when any of them is missing.
 *
 * Never touches the network — see `device-llm/files.ts`'s identical note.
 */
export async function localModelFiles(): Promise<KokoroTtsModel<KokoroVoice> | null> {
  const et = getExecuTorch();
  const model = kokoroModel();
  if (!et || !model) return null;

  const urls = collectUrls(model);
  const present = await Promise.all(urls.map((url) => RNBlobUtil.fs.exists(cachePath(url)).catch(() => false)));
  if (!present.every(Boolean)) return null;

  try {
    return await et.download(model);
  } catch {
    return null;
  }
}
