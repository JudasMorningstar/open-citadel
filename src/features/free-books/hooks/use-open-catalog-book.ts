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
 *
 * The callback is the same one for the life of the screen, and looks the book
 * up when it is pressed. Built from the lists, it was a new function each time
 * a shelf arrived or a page of "View all" loaded, and every tile takes it as
 * a prop: each arrival redrew every shelf and every tile on the page, mid
 * scroll, since arrivals are what scrolling Explore causes.
 */
export function useOpenFromLists(lists: CatalogBook[][]) {
  const openBook = useOpenCatalogBook();
  const latest = React.useRef(lists);
  React.useEffect(() => {
    latest.current = lists;
  }, [lists]);
  return React.useCallback(
    (id: string | number) => {
      const wanted = Number(id);
      for (const list of latest.current) {
        const book = list.find((candidate) => candidate.id === wanted);
        if (book) return openBook(book);
      }
    },
    [openBook],
  );
}
