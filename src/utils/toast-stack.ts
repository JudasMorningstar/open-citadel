/**
 * Where each toast in the pile sits: collapsed (cards peeking out from under
 * the front one) or spread (every card in a column). Pure, so the maths the
 * toasts move by is tested rather than eyeballed.
 */

/** How much of each card behind the front one shows past the front one's bottom. */
export const STACK_PEEK = 14;
export const STACK_SCALE_STEP = 0.05;
/** Past this depth a collapsed card fades out rather than draw a sliver nobody can read. */
export const MAX_VISIBLE = 3;
/** Between cards once the pile is spread. */
export const SPREAD_GAP = 8;

export type StackPlacement = {
  y: number;
  scale: number;
  /** Whether the card's words show. A collapsed card behind shows only its edge. */
  contentVisible: boolean;
  visible: boolean;
};

/**
 * A collapsed card `index` deep, placed so its bottom edge shows
 * `index * STACK_PEEK` below the front card's.
 *
 * Offset from the front card's bottom and not the card's own top: cards are
 * not all one height, and a two-line toast in front covered a one-line one
 * behind it completely, so the pile read as a single toast. The scale is
 * about the centre, which lifts the bottom by half what it takes.
 */
export function collapsedOffset(index: number, height: number, frontHeight: number, scale: number): number {
  if (index === 0 || height === 0 || frontHeight === 0) return index * STACK_PEEK;
  return frontHeight + index * STACK_PEEK - (height * (1 + scale)) / 2;
}

/**
 * Each card's top once the pile is spread: one under another, front first,
 * `SPREAD_GAP` apart. `frontFirst` is the live cards' ids, newest first.
 */
export function spreadOffsets(frontFirst: number[], heights: Record<number, number>): Record<number, number> {
  const offsets: Record<number, number> = {};
  let top = 0;
  for (const id of frontFirst) {
    offsets[id] = top;
    top += (heights[id] ?? 0) + SPREAD_GAP;
  }
  return offsets;
}

type PlacementInput = {
  index: number;
  height: number;
  frontHeight: number;
  spread: boolean;
  /** This card's top in the spread column. */
  spreadOffset: number;
};

export function stackPlacement({ index, height, frontHeight, spread, spreadOffset }: PlacementInput): StackPlacement {
  if (spread) return { y: spreadOffset, scale: 1, contentVisible: true, visible: true };
  const scale = 1 - index * STACK_SCALE_STEP;
  return {
    y: collapsedOffset(index, height, frontHeight, scale),
    scale,
    contentVisible: index === 0,
    visible: index < MAX_VISIBLE,
  };
}
