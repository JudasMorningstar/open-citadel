/*
 * How far through a publication the reader is.
 *
 * The reader says where the page on screen STARTS: on the last of five pages
 * it reports 0.8, and never 1. Its figure for the whole publication is
 * coarser still, since it moves a "position" (about a kilobyte of text) at a
 * time: a post that is two positions long reads 0% or 50% and nothing else,
 * so one read to its last line stayed at 50% in Continue Reading for good.
 *
 * So for a publication that is one file (a blog post), the page on screen
 * counts as read: where it starts, plus one page. How much of the file a page
 * is comes from watching the pages turn.
 */

/** The parts of a reader locator this needs. */
export type Spot = {
  href: string;
  locations?: { progression?: number; totalProgression?: number };
};

/** Less than this is the same page reported twice, not a turn. */
const SAME_PAGE = 0.0005;

const within = (spot: Spot) => spot.locations?.progression ?? 0;

/** Whether two locators are the same page of the same file. */
export function sameSpot(a: Spot | null, b: Spot | null): boolean {
  return !!a && !!b && a.href === b.href && Math.abs(within(a) - within(b)) < SAME_PAGE;
}

/**
 * What share of its file one page is, as far as the turns seen so far say.
 * `known` is what was learned before, or null in a file not yet paged through.
 *
 * The smallest move seen: a turn moves one page and a jump (the contents, a
 * highlight) moves several, so the smallest is the page. Each file is paged
 * to its own length, so a new file starts from nothing.
 */
export function learnPageStep(known: number | null, from: Spot | null, to: Spot): number | null {
  if (!from) return known;
  if (from.href !== to.href) return null;
  const moved = Math.abs(within(to) - within(from));
  if (moved < SAME_PAGE) return known;
  return known === null ? moved : Math.min(known, moved);
}

/**
 * The fraction read at `spot`, 0 to 1.
 *
 * `oneFile`: the publication is a single file, so the place in the file is
 * the place in the whole, and the page on screen is counted as read. Until a
 * page has been turned its size is not known and the start of the page is
 * all there is to go on.
 *
 * A book keeps the reader's own figure, but for one place: the last page of
 * its last file (`lastFile`) is the end of the book, which that figure, being
 * where the page starts, never says.
 */
export function readFraction(
  spot: Spot,
  { oneFile, pageStep, lastFile = false }: { oneFile: boolean; pageStep: number | null; lastFile?: boolean },
): number {
  const start = within(spot);
  // Within a hair of the end is the end: the steps do not sum to exactly 1.
  const onLastPage = pageStep !== null && start + pageStep > 1 - SAME_PAGE;
  if (!oneFile) return lastFile && onLastPage ? 1 : (spot.locations?.totalProgression ?? 0);
  if (pageStep === null) return start;
  return onLastPage ? 1 : start + pageStep;
}

/**
 * Whether a fraction read is the whole of it: what the reader's header shows
 * as "100% READ". Leaving the reader there is what marks a book or a post as
 * finished, so the rule is the figure the reader was looking at, not a finer
 * one they could not see.
 */
export function isReadThrough(fraction: number | null): boolean {
  return fraction !== null && Math.round(fraction * 100) >= 100;
}

/**
 * What to save for a place, given what was saved before.
 *
 * Opening a post again on the page it was left on says nothing new, and with
 * no page turned yet the figure would be the start of that page: a finished
 * post would drop from 100% the moment it was looked at. The saved figure
 * stands until the place moves or the page's size is known.
 */
export function fractionToSave(
  fraction: number,
  spot: Spot,
  pageStep: number | null,
  saved: { fraction: number; spot: Spot | null } | null,
): number {
  if (pageStep !== null || !saved || !sameSpot(saved.spot, spot)) return fraction;
  return Math.max(saved.fraction, fraction);
}
