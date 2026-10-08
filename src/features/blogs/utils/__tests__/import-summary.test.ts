import { describe, expect, it } from 'vitest';

import { importOutcome, importProgressLabel } from '@/features/blogs/utils/import-summary';

const feed = { title: 'x', feedUrl: 'https://x.test/feed' };

describe('import summary', () => {
  it('counts as it goes', () => {
    expect(importProgressLabel({ done: 3, total: 12 })).toBe('Following 3 of 12 blogs');
    expect(importProgressLabel({ done: 0, total: 1 })).toBe('Following 0 of 1 blog');
  });

  it('says what came across and what did not', () => {
    expect(importOutcome({ added: 1, failed: [] })).toBe('Now following 1 blog.');
    expect(importOutcome({ added: 10, failed: [feed, feed] })).toBe('Now following 10 blogs. 2 could not be reached.');
    expect(importOutcome({ added: 0, failed: [feed, feed] })).toBe(
      'None of the 2 blogs could be reached. Check your connection and try again.',
    );
  });
});
