import { describe, expect, it } from 'vitest';

import { byLastRead } from '@/features/library/utils/last-read';

describe('byLastRead', () => {
  const books = [
    { id: 'a', addedAt: '2026-01-01' },
    { id: 'b', addedAt: '2026-02-01' },
    { id: 'c', addedAt: '2026-03-01' },
    { id: 'd', addedAt: '2026-04-01' },
  ];

  it('leads with the book read last, then the rest by when they were read', () => {
    const order = byLastRead(books, { a: '2026-09-27T10:00:00Z', c: '2026-09-28T08:00:00Z' }).map((b) => b.id);
    expect(order).toEqual(['c', 'a', 'd', 'b']);
  });

  it('leaves the list it was given alone', () => {
    byLastRead(books, { d: '2026-09-28' });
    expect(books.map((b) => b.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});
