/**
 * The pace of a smooth reveal, and where each step of it may stop.
 *
 * Some providers hold a whole reply back and release it in one piece, which
 * on screen is the answer popping in. Shown a word at a time at a reading
 * pace, it reads as a calm stream instead. The pace is a floor of about
 * twelve words a second, raised for a long reply so that no reply takes more
 * than `MAX_REVEAL_MS` to show: calm for a sentence, and never a typewriter
 * for a page.
 *
 * Pure, so it is tested without timers.
 */

/** The pace a short reply is shown at, in characters a second. */
export const REVEAL_CHARS_PER_SECOND = 70;

/** The longest any reply takes to show, however long it is. */
export const MAX_REVEAL_MS = 4_000;

/**
 * Characters a second for a reply this long. Sized from the whole reply,
 * not what is left of it: a pace that shrank with the backlog crawled at the
 * end.
 */
export function revealRate(targetLength: number): number {
  return Math.max(REVEAL_CHARS_PER_SECOND, targetLength / (MAX_REVEAL_MS / 1000));
}

/**
 * Past this, a run without a space is not a word to keep whole: a URL, or a
 * language written without spaces, which would otherwise show nothing until
 * the reveal reached its end.
 */
export const LONGEST_WHOLE_WORD = 24;

/**
 * The prefix of `target` to show once the reveal has reached `cursor`
 * characters. It stops before the word the cursor is inside, so a word
 * appears whole or not at all, and everything shows once the cursor is past
 * the end. A run longer than `LONGEST_WHOLE_WORD` is shown as far as the
 * cursor instead.
 */
export function wholeWordsUpTo(target: string, cursor: number): number {
  if (cursor >= target.length) return target.length;
  const at = Math.max(0, Math.floor(cursor));
  let end = at;
  while (end > 0 && !/\s/.test(target[end] ?? '')) end -= 1;
  return at - end > LONGEST_WHOLE_WORD ? at : end;
}
