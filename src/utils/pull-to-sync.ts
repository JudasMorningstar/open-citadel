/** The pull-to-sync gap's geometry, timing and resistance. See `usePullToSync`. */

/**
 * How tall the gap is once it is holding, in points.
 *
 * Enough for the loader, the gap under it and one line of label, and no more:
 * the gap pushes the shelf below it down the screen for as long as a scan
 * lasts, so every extra point is a point of the Library nobody can see.
 */
export const GAP = 72;

/**
 * How far the gap has to be open before letting go starts a scan.
 *
 * Read against the RESISTED distance, not the finger's, so it is worth doing
 * the arithmetic before changing it: `resist` is asymptotic to 115, and at 64
 * it wanted 144 points of travel to arm — half again as far as a pull-to-
 * refresh anywhere else. At 52 it arms at about 95, and the gap keeps opening
 * a little past that, which reads as the pull confirming rather than stopping.
 */
export const TRIGGER = 52;

/**
 * How far the drag has to travel before the pull takes it.
 *
 * The Library is one page of a horizontal pager, and the shelf under the
 * finger scrolls vertically, so a drag here has two other readings. Waiting
 * this long before claiming it means an ordinary flick up the page, and an
 * ordinary swipe across to Samwell, never open a gap on the way past.
 */
export const ACTIVATE = 12;

/**
 * How far a touch has to move before it is read as having a direction at all.
 *
 * A finger landing on glass wobbles a point or two in every direction before
 * it goes anywhere, and this gesture answers with a verdict it cannot take
 * back: one `manager.fail()` and the touch belongs to the scroll view for
 * good. Reading a direction out of that first noise is what made the pull
 * unreliable — a single upward point of jitter killed it before it began.
 */
export const SLOP = 6;

/**
 * How long the gap waits for a scan it asked for.
 *
 * Letting go past `TRIGGER` starts a scan, but the pipeline has a row to write
 * and a folder to open before `sync.status` says so, and on a big library over
 * SAF that is not instant. The gap used to unwind on a timer sized to guess
 * that delay, and when the guess was short — which it often was — the reader
 * watched it shut and reopen. It now holds itself open from the moment of the
 * release until the scan reports, and this is only the backstop for a scan
 * that never does: long enough that no real one is cut off, short enough that
 * a gap holding nothing does not become furniture.
 */
export const SCAN_GRACE_MS = 5_000;

/**
 * Resistance, so the gap never simply follows the finger.
 *
 * Asymptotic rather than clamped: it gives less and less instead of stopping
 * dead, which is how a real object behaves and is what tells the hand it has
 * reached the end without a boundary being drawn. The same curve the toasts
 * use for the direction that does not dismiss.
 */
export function resist(distance: number) {
  "worklet";
  // Callers pass a distance of zero or more; see the clamp in `onUpdate`.
  return (GAP * 1.6 * distance) / (distance + GAP * 1.6);
}
