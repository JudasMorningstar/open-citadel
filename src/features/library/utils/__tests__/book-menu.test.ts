import { describe, expect, it } from 'vitest';

import { bookMenu } from '@/features/library/utils/book-menu';
import type { Book } from '@/stores/books';

const book = (patch: Partial<Book>) => ({ id: 'b', title: 'Dune', status: null, isFavorite: 0, ...patch }) as Book;
const all = { collections: true, rename: true, delete: true };
const keys = (b: Book, options = all) => bookMenu(b, options).map((row) => row.key);

describe('bookMenu', () => {
  it('offers queueing and finishing to a book on no shelf', () => {
    expect(keys(book({}))).toEqual(['open', 'favorite', 'collection', 'queue', 'finish', 'rename', 'delete']);
  });

  it('offers leaving Continue Reading to a book being read', () => {
    expect(keys(book({ status: 'reading' }))).toContain('stop-reading');
  });

  it('offers leaving the queue, not joining it, to a queued book', () => {
    const rows = keys(book({ status: 'queued' }));
    expect(rows).toContain('dequeue');
    expect(rows).not.toContain('queue');
  });

  it('offers unfinishing a finished book, and no queue', () => {
    const rows = keys(book({ status: 'archived', isFavorite: 1 }));
    expect(rows).toEqual(['open', 'unfavorite', 'collection', 'unfinish', 'rename', 'delete']);
  });

  it('leaves out what the screen does not offer', () => {
    expect(keys(book({}), { collections: false, rename: false, delete: false })).toEqual(['open', 'favorite', 'queue', 'finish']);
  });
});
