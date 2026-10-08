import React from 'react';

import type { Book } from '@/stores/books';
import { matchesQuery } from '@/utils/format';

/** A search over a list of books, by title or author. */
export function useBookListSearch(books: Book[]) {
  const [query, setQuery] = React.useState('');
  const results = React.useMemo(
    () => (query.trim() ? books.filter((b) => matchesQuery(query, b.title, b.author)) : books),
    [books, query],
  );
  return { query, setQuery, results, emptyText: query ? 'No results.' : null };
}
