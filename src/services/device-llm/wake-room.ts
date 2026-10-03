/**
 * What to do about memory before a brain is loaded.
 *
 * Loading is where a phone runs out: the runtime packs the weights and
 * commits the model's working memory in one go (a gigabyte of it for Gemma 4
 * E2B, hundreds of megabytes for the others), and Android answers a shortfall
 * by killing the app, not by failing the load. Nothing can catch that, so the
 * decision is made before anything is asked of the runtime.
 *
 * The verdict itself is `modelFit`'s (`utils/memory-estimator`), the same one
 * the picker shows. This only says what waking does with it.
 */

import type { MemoryStatus } from '@/utils/memory-estimator';

export type WakeRoom =
  /** The phone cannot hold it. Say so instead of trying. */
  | 'refuse'
  /** It fits with little to spare: free what else is held first. */
  | 'makeRoom'
  | 'load';

export function wakeRoom(fit: MemoryStatus): WakeRoom {
  if (fit === 'wontRun') return 'refuse';
  if (fit === 'tight') return 'makeRoom';
  return 'load';
}

const GB = 1024 * 1024 * 1024;

/** Why a brain was not loaded, for the reader. */
export function tooLargeMessage(name: string, totalBytes: number): string {
  const phone = totalBytes > 0 ? ` (${(totalBytes / GB).toFixed(1)} GB)` : '';
  return `${name} needs more memory than this phone has${phone}. Choose a smaller brain.`;
}

/**
 * What to say when the last attempt ended with the app gone.
 *
 * Android gives no reason to the app it kills, so this cannot know it was
 * memory. On a phone where the brain is a tight fit it nearly always is.
 */
export function interruptedMessage(fit: MemoryStatus): string {
  return fit === 'tight'
    ? 'Samwell stopped suddenly last time. This brain is a tight fit for your phone. If it happens again, close other apps or choose a smaller brain.'
    : 'Samwell stopped suddenly last time. If it happens again, choose a smaller brain.';
}
