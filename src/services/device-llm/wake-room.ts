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
 * Why a brain the phone has already ended the app over is not woken again.
 * `heldBytes` is the most the app was seen holding in that run, when known.
 *
 * `fits` is whether the brain should fit this phone going by its size. One
 * that should was closed over what else the phone was holding at the time
 * (seen on a Galaxy A33: a 1.2 GB brain closed minutes after a 4 GB one had
 * filled the phone's memory), and telling its reader to choose a smaller
 * brain would be advice about the wrong thing.
 */
export function closedByPhoneMessage(name: string, heldBytes: number | null, fits = false): string {
  const held = heldBytes ? ` It was using ${(heldBytes / GB).toFixed(1)} GB.` : '';
  const advice = fits ? 'Close other apps and try again.' : 'Choose a smaller brain.';
  return `Your phone closed the app the last time ${name} was running, to get its memory back.${held} ${advice}`;
}

/** The same, short enough for a toast, pointing at where the rest is said. */
export function closedByPhoneNotice(name: string): string {
  return `Your phone closed the app over ${name} last time. Tap CLOSED BY PHONE to see why.`;
}

/** What to say when the last attempt ended in a fault of the app's own, which no smaller brain would fix. */
export function faultMessage(what: string): string {
  return `Samwell stopped last time because of a fault in the app (${what}), not your phone's memory.`;
}

/**
 * What to say when the last attempt ended with the app gone and there is no
 * record of why (iOS, an older Android). This cannot know it was memory. On a
 * phone where the brain is a tight fit it nearly always is.
 */
export function interruptedMessage(fit: MemoryStatus): string {
  return fit === 'tight'
    ? 'Samwell stopped suddenly last time. This brain is a tight fit for your phone. If it happens again, close other apps or choose a smaller brain.'
    : 'Samwell stopped suddenly last time. If it happens again, choose a smaller brain.';
}
