/**
 * How Supertonic's utterances are cut so each one starts soon.
 *
 * The reader asks for a sentence only about a second before the last one runs
 * out (the native engine's audio buffer is that long), and nothing of a chunk
 * can be heard until the whole chunk is made. Left to the pipeline, a long
 * sentence is one chunk of up to 240 characters: on a Galaxy A33 that was
 * fourteen seconds of speech and twelve seconds of silence before it.
 *
 * So the sentence is given a short first piece, sized to what this phone can
 * make in about the time it has, cut at a comma where there is one. The rest
 * follows in pieces a little longer, since each is made while the one before
 * it plays. A phone fast enough gets the sentence whole.
 *
 * The other half of keeping up is how much work each chunk is, which is its
 * denoising steps: see `supertonicSteps`.
 */

/** One piece of an utterance, and the most its chunks may hold (`undefined`: the pipeline's own limit). */
export interface Part {
  text: string;
  limit: number | undefined;
}

/** Characters Supertonic speaks in a second at normal speed: 240 measured at 14.1 seconds. */
const CHARS_PER_SECOND = 17;

/** How long making the first piece may take: the second the reader gives, and a pause no longer than one between sentences. */
const WAIT_BUDGET_SECONDS = 2;

/** The pipeline's own limit on a chunk. Asking for more is refused. */
const MOST_CHARS = 240;

export const HEAD_CHARS = { least: 40, unmeasured: 60 } as const;

/** A remainder shorter than this is not worth a join: the sentence is left whole. */
const LEAST_REST_CHARS = 24;

/** The longest first piece a phone at this pace can make in time. */
export function headCharsFor(pace: number | null): number {
  if (pace === null) return HEAD_CHARS.unmeasured;
  const affordable = Math.round((WAIT_BUDGET_SECONDS / pace) * CHARS_PER_SECOND);
  return Math.min(MOST_CHARS, Math.max(HEAD_CHARS.least, affordable));
}

const CLAUSE_END = /[,;:—–]\s/g;

/**
 * `text` as a first piece of at most `most` characters and what is left, or
 * the whole text and '' when it is short enough or has nowhere to cut. Cuts
 * after the last comma (or the like) in the back half of the window, where a
 * voice would pause anyway, and otherwise at the last space.
 */
export function splitHead(text: string, most: number): [head: string, rest: string] {
  const whole = text.trim();
  if (whole.length <= most + LEAST_REST_CHARS) return [whole, ''];

  const window = whole.slice(0, most + 1);
  let cut = -1;
  for (const match of window.matchAll(CLAUSE_END)) {
    if (match.index >= most / 2) cut = match.index + 1;
  }
  if (cut < 0) cut = window.lastIndexOf(' ');
  if (cut <= 0) return [whole, ''];
  return [whole.slice(0, cut).trim(), whole.slice(cut).trim()];
}

/** One Supertonic utterance as the pieces to make, in order, for a phone at this pace. */
export function supertonicParts(text: string, pace: number | null): Part[] {
  const head = headCharsFor(pace);
  const [first, rest] = splitHead(text, head);
  if (!rest) return [{ text: first, limit: undefined }];

  // Each later piece is made while the one before it plays, so it may be as
  // much longer as the phone is faster than speech.
  const longer = Math.round(head / (pace ?? 1));
  return [
    { text: first, limit: undefined },
    { text: rest, limit: longer >= MOST_CHARS ? undefined : Math.max(head, longer) },
  ];
}

/**
 * Supertonic's denoising steps. Each chunk costs one pass of its largest
 * model per step, then one of the vocoder, which weighs about the same: on a
 * Galaxy A33 the eight steps the pipeline defaults to made speech at 1.4
 * seconds of work per second spoken, and the steps were eight ninths of it.
 * Fewer steps is the same speech, a little rougher, made sooner.
 */
export const SUPERTONIC_STEPS = { best: 8, least: 4, unmeasured: 5 } as const;

/** The pace the step count aims for: under real time by enough that a warm phone still keeps up. */
const STEPS_TARGET_PACE = 0.8;

/**
 * How many denoising steps this phone can afford. `bestPace` is its pace at
 * the best step count (see `atBestSteps`), or null before it has been
 * measured.
 */
export function supertonicSteps(bestPace: number | null): number {
  const { best, least, unmeasured } = SUPERTONIC_STEPS;
  if (bestPace === null) return unmeasured;
  const affordable = Math.floor((STEPS_TARGET_PACE * (best + 1)) / bestPace) - 1;
  return Math.min(best, Math.max(least, affordable));
}

/** What `workSeconds` at `steps` would have been at the best step count, so paces at different counts compare. */
export function atBestSteps(workSeconds: number, steps: number): number {
  return (workSeconds * (SUPERTONIC_STEPS.best + 1)) / (steps + 1);
}
