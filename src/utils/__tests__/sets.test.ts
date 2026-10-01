import { describe, expect, it } from 'vitest';

import { sameSet } from '@/utils/sets';

describe('sameSet', () => {
  it('is true for the same members in any order', () => {
    expect(sameSet(new Set(['a', 'b']), new Set(['b', 'a']))).toBe(true);
    expect(sameSet(new Set(), new Set())).toBe(true);
  });

  it('is false when a member differs or is missing', () => {
    expect(sameSet(new Set(['a', 'b']), new Set(['a', 'c']))).toBe(false);
    expect(sameSet(new Set(['a']), new Set(['a', 'b']))).toBe(false);
  });
});
