import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { createCatalogBookQueryOptions } from '@/query-manager/gutenberg';
import type { CatalogBook } from '@/services/gutenberg/records';

/**
 * A free book's route params: what the list already knew, so its page opens
 * with a title and its cover. The cover is the list's own picture, already
 * loaded; waiting for the catalog entry to name it left the page's cover
 * blank for the length of a network read.
 */
export type FreeBookParams = { id: string; title?: string; author?: string; coverUrl?: string };

/**
 * Opens a free book's page. Its catalog entry is asked for at the tap, so it
 * is usually in by the time the slide lands.
 */
export function useOpenCatalogBook() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return React.useCallback(
    (book: CatalogBook) => {
      void queryClient.prefetchQuery(createCatalogBookQueryOptions(book.id));
      const params: FreeBookParams = { id: String(book.id), title: book.title };
      if (book.author) params.author = book.author;
      if (book.coverUrl) params.coverUrl = book.coverUrl;
      router.push({ pathname: '/free-books/book/[id]', params });
    },
    [queryClient, router],
  );
}

/**
 * Opens a book by its eBook number from any of the lists on screen. A tile
 * hands back only its id; this finds the book it came from.
 */
export function useOpenFromLists(lists: CatalogBook[][]) {
  const openBook = useOpenCatalogBook();
  const byId = React.useMemo(() => new Map(lists.flat().map((book) => [book.id, book])), [lists]);
  return React.useCallback(
    (id: string | number) => {
      const book = byId.get(Number(id));
      if (book) openBook(book);
    },
    [byId, openBook],
  );
}
