import { describe, expect, it } from 'vitest';

import { CATCH_UP_TICKS, MIN_REVEAL_STEP, nextRevealLength } from '@/utils/reveal-step';

const REPLY =
  'Your three books are in your Library. I can also find a few podcasts and blogs that fit what you are working toward, and follow them for you.';

describe('nextRevealLength', () => {
  it('ends every step on a word boundary', () => {
    let shown = 0;
    while (shown < REPLY.length) {
      shown = nextRevealLength(shown, REPLY);
      expect(shown === REPLY.length || /\s/.test(REPLY[shown])).toBe(true);
    }
  });

  it('keeps a brisk floor, so a real stream is not slowed', () => {
    expect(nextRevealLength(0, 'Hi there')).toBe(8);
    expect(nextRevealLength(0, REPLY)).toBeGreaterThanOrEqual(MIN_REVEAL_STEP);
  });

  it('catches up a reply that arrived whole in about CATCH_UP_TICKS', () => {
    const long = REPLY.repeat(20);
    let shown = 0;
    let ticks = 0;
    while (shown < long.length) {
      shown = nextRevealLength(shown, long);
      ticks += 1;
    }
    expect(ticks).toBeLessThanOrEqual(CATCH_UP_TICKS + 5);
  });

  it('has nothing to do once everything is shown', () => {
    expect(nextRevealLength(REPLY.length, REPLY)).toBe(REPLY.length);
  });
});
