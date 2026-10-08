import { describe, expect, it } from 'vitest';

import { collapsedOffset, MAX_VISIBLE, SPREAD_GAP, spreadOffsets, STACK_PEEK, stackPlacement } from '@/utils/toast-stack';

/** Where a card's bottom lands with a centre-origin scale. */
const bottomOf = (y: number, height: number, scale: number) => y + (height * (1 + scale)) / 2;

describe('collapsedOffset', () => {
  it('leaves the front card where it is', () => {
    expect(collapsedOffset(0, 60, 60, 1)).toBe(0);
  });

  it('shows a shorter card behind a taller front one', () => {
    const scale = 0.95;
    const y = collapsedOffset(1, 48, 72, scale);
    expect(bottomOf(y, 48, scale)).toBeCloseTo(72 + STACK_PEEK);
  });

  it('shows a taller card behind a shorter front one by the same step', () => {
    const scale = 0.9;
    const y = collapsedOffset(2, 72, 48, scale);
    expect(bottomOf(y, 72, scale)).toBeCloseTo(48 + 2 * STACK_PEEK);
  });

  it('falls back to a plain step until the heights are measured', () => {
    expect(collapsedOffset(2, 0, 60, 0.9)).toBe(2 * STACK_PEEK);
  });
});

describe('spreadOffsets', () => {
  it('puts each card under the one in front of it', () => {
    expect(spreadOffsets([3, 2, 1], { 3: 60, 2: 48, 1: 72 })).toEqual({
      3: 0,
      2: 60 + SPREAD_GAP,
      1: 60 + 48 + 2 * SPREAD_GAP,
    });
  });
});

describe('stackPlacement', () => {
  it('shows every card, words and all, once spread', () => {
    expect(stackPlacement({ index: MAX_VISIBLE + 1, height: 50, frontHeight: 50, spread: true, spreadOffset: 120 })).toEqual({
      y: 120,
      scale: 1,
      contentVisible: true,
      visible: true,
    });
  });

  it('shows only the edge of a collapsed card behind, and hides past the visible pile', () => {
    const behind = stackPlacement({ index: 1, height: 50, frontHeight: 50, spread: false, spreadOffset: 0 });
    expect(behind.contentVisible).toBe(false);
    expect(behind.visible).toBe(true);
    expect(stackPlacement({ index: MAX_VISIBLE, height: 50, frontHeight: 50, spread: false, spreadOffset: 0 }).visible).toBe(false);
  });
});
