import { useBooksStore } from '@/stores/books';

/**
 * How far through a book the reader is, 0..1, subscribed per book so a page
 * turn re-renders one card and not the shelf around it.
 *
 * Read, not fetched, and not mirrored into local state. It was `useState`
 * filled by a query on every focus, which is two copies of one fact and a race
 * between them: `closeBook` cannot await its write, so the read that ran when
 * the Library came back usually beat it and the bar showed the previous
 * visit's position. The store holds the one copy, and the code that writes
 * the row is what updates it.
 */
export function useBookProgress(bookId: string): number {
  return useBooksStore((s) => s.progressByBook[bookId] ?? 0);
}
