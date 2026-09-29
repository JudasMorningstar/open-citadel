/**
 * How much more of a reply to show on the next tick of a smooth reveal.
 *
 * Some providers hold a whole reply back and release it in one piece, which
 * on screen is the answer popping in. Revealing it a few words a tick reads
 * as the stream it should have been. A brisk floor keeps a real stream from
 * being slowed, and a whole reply is shown within about `CATCH_UP_TICKS`, so
 * a long reply that arrived at once still lands in around a second rather
 * than making the reader wait for a typewriter. Steps end on a word boundary
 * so a word never appears half-written.
 *
 * Pure, so it is tested without timers.
 */

/** The fewest characters a tick reveals: a quick reading pace. */
export const MIN_REVEAL_STEP = 6;

/** How many ticks a backlog of any size is caught up in. */
export const CATCH_UP_TICKS = 25;

/** The length of the prefix of `target` to show after this tick. */
export function nextRevealLength(shown: number, target: string): number {
  if (shown >= target.length) return target.length;
  // Sized from the whole reply, not what is left of it: a step that shrank
  // with the backlog slowed to a crawl at the end, three times as long.
  const step = Math.max(MIN_REVEAL_STEP, Math.ceil(target.length / CATCH_UP_TICKS));
  let end = Math.min(target.length, shown + step);
  while (end < target.length && !/\s/.test(target[end])) end += 1;
  return end;
}
