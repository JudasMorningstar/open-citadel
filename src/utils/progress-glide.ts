/**
 * How a progress bar travels between two samples of real work.
 *
 * A download reports where it is every so often, not continuously. On Android
 * the system DownloadManager writes its byte count down at most every two
 * seconds, whatever is asked of it, so a bar drawn straight from the samples
 * stands still and then jumps. The bar instead takes as long to reach a sample
 * as the last one took to arrive: it is always moving, and always toward a
 * figure that was really reported, never past it.
 */

/** A first sample, or one after a long silence, lands quickly. */
export const GLIDE_FIRST_MS = 300;
/** Samples closer together than this are drawn as they come. */
export const GLIDE_MIN_MS = 150;
/** Past this the bar would still be travelling to a figure long out of date. */
export const GLIDE_MAX_MS = 2500;

/**
 * How long the bar should take to reach the sample that has just arrived.
 *
 * @param previousAt When the sample before it arrived, or null for the first.
 * @param now When this one arrived. Both in milliseconds.
 */
export function glideDuration(previousAt: number | null, now: number): number {
  if (previousAt == null) return GLIDE_FIRST_MS;
  const gap = now - previousAt;
  // A stalled transfer picking up again: the gap says how long it was stuck,
  // not how soon the next sample is due.
  if (gap > GLIDE_MAX_MS * 2) return GLIDE_FIRST_MS;
  return Math.min(Math.max(gap, GLIDE_MIN_MS), GLIDE_MAX_MS);
}

/** A fraction as the whole percent the meters print. Never 100 before the work is done. */
export function percentLabel(fraction: number): string {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const whole = clamped >= 1 ? 100 : Math.min(99, Math.floor(clamped * 100));
  return `${whole}%`;
}

/**
 * What a download's meter says beside its bar.
 *
 * Nothing has been reported until the sizes are known and the first bytes are
 * counted, which takes a few seconds. "0%" through that reads as stuck; it is
 * starting, so it says so.
 */
export function downloadLabel(fraction: number): string {
  return fraction > 0 ? percentLabel(fraction) : 'STARTING';
}
