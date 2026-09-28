import { describe, expect, it } from 'vitest';

import { formatPubDate } from '@/utils/pub-date';

describe('formatPubDate', () => {
  it('writes relative dates', () => {
    const now = new Date(2026, 8, 26, 12);
    expect(formatPubDate(new Date(2026, 8, 26, 3).toISOString(), now)).toBe('Today');
    expect(formatPubDate(new Date(2026, 8, 25, 23).toISOString(), now)).toBe('Yesterday');
    expect(formatPubDate(null, now)).toBe('');
  });
});
