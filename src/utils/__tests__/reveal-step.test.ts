import { describe, expect, it } from 'vitest';

import {
  LONGEST_WHOLE_WORD,
  MAX_REVEAL_MS,
  REVEAL_CHARS_PER_SECOND,
  revealRate,
  wholeWordsUpTo,
} from '@/utils/reveal-step';

const REPLY =
  'Your three books are in your Library. I can also find a few podcasts and blogs that fit what you are working toward, and follow them for you.';

describe('revealRate', () => {
  it('shows a short reply at the calm floor', () => {
    expect(revealRate(REPLY.length)).toBe(REVEAL_CHARS_PER_SECOND);
  });

  it('never takes longer than MAX_REVEAL_MS for a long reply', () => {
    const long = REPLY.repeat(20).length;
    expect((long / revealRate(long)) * 1000).toBeCloseTo(MAX_REVEAL_MS);
  });
});

describe('wholeWordsUpTo', () => {
  it('stops before a word the cursor is inside', () => {
    // "Your three" with the cursor in "three".
    expect(REPLY.slice(0, wholeWordsUpTo(REPLY, 7))).toBe('Your');
  });

  it('keeps revealing text written without spaces', () => {
    const unspaced = '読書は心の糧であり、毎日少しずつ続けることが大切です。'.repeat(3);
    expect(wholeWordsUpTo(unspaced, 40)).toBe(40);
    expect(wholeWordsUpTo('https://example.com/a/very/long/path/to/a/page', LONGEST_WHOLE_WORD + 5)).toBe(
      LONGEST_WHOLE_WORD + 5,
    );
  });

  it('only ever stops at a word boundary or the end', () => {
    for (let cursor = 0; cursor <= REPLY.length + 3; cursor += 1) {
      const end = wholeWordsUpTo(REPLY, cursor);
      expect(end === 0 || end === REPLY.length || /\s/.test(REPLY[end])).toBe(true);
      expect(end).toBeLessThanOrEqual(Math.max(cursor, 0));
    }
  });

  it('shows everything, the last word included, once past the end', () => {
    expect(wholeWordsUpTo(REPLY, REPLY.length)).toBe(REPLY.length);
  });
});
