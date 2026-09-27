import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { useOpenFromLists } from '@/features/free-books/hooks/use-open-catalog-book';
import { createShelfQueryOptions } from '@/query-manager/gutenberg';
import { findShelf } from '@/services/gutenberg/shelves';

/**
 * A whole shelf, from its VIEW ALL. It opens on the page Explore already has
 * and asks for the next only when the reader reaches the end of the last one,
 * so nobody pays for pages they never scroll to.
 */
export function useCatalogShelfScreen(param: string | undefined) {
  const router = useRouter();
  const shelf = findShelf(param);
  const query = useInfiniteQuery(createShelfQueryOptions(shelf));
  const books = React.useMemo(() => query.data?.pages.flatMap((page) => page.books) ?? [], [query.data]);
  const lists = React.useMemo(() => [books], [books]);
  const open = useOpenFromLists(lists);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = React.useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return {
    title: shelf.label,
    books,
    loading: query.isPending,
    loadingMore: isFetchingNextPage,
    emptyText: query.isError ? 'Could not reach Project Gutenberg. Check your connection.' : 'Nothing on this shelf yet.',
    open,
    loadMore,
    back: () => router.back(),
  };
}
