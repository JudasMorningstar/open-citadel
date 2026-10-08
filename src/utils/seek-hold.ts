/**
 * Holding the player's position at a seek's target until the audio gets there.
 *
 * A seek is asynchronous in the native player: for a moment after it is sent,
 * the player still reports where it was. Anything that polls the position in
 * that window (the scrubber's clock, the time labels, the next skip) would
 * read the old place and jump back to it, so the scrub the listener just made
 * snapped back before snapping forward again. Pure.
 */
export type SeekHold = { target: number; at: number } | null;

/** Longest a seek is waited for; past it the player's own answer wins. */
export const SEEK_HOLD_MS = 2500;
/** How close the reported position has to come to count as arrived, in seconds. */
const ARRIVED_WITHIN_SEC = 1.5;

/**
 * The position to draw: the seek's target while the player is still catching
 * up to it, the player's own report once it has (or once the wait is over).
 * `released` says the hold can be dropped.
 */
export function heldPosition(reported: number, hold: SeekHold, now: number): { position: number; released: boolean } {
  if (!hold) return { position: reported, released: false };
  const expired = now - hold.at > SEEK_HOLD_MS;
  const arrived = Math.abs(reported - hold.target) <= ARRIVED_WITHIN_SEC;
  if (expired || arrived) return { position: reported, released: true };
  return { position: hold.target, released: false };
}
