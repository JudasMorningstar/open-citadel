import type { UseQueryOptions } from '@tanstack/react-query';

import { libraryKeys } from '@/query-manager/library/keys';
import type { Book } from '@/stores/books';
import { useCollectionsStore } from '@/stores/collections';

type Options<T, TData = T> = Omit<UseQueryOptions<T, Error, TData>, 'queryKey' | 'queryFn'>;

/**
 * One collection's books. Local, so it never goes stale on a timer: the
 * collection screen invalidates it when it changes the membership, and reads
 * it again whenever it comes back into focus (a book may have been deleted
 * elsewhere). Cached, so coming back to a collection draws it at once.
 */
export function createCollectionBooksQueryOptions(collectionId: string, options?: Options<Book[]>) {
  return {
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    networkMode: 'always',
    retry: false,
    ...options,
    queryKey: libraryKeys.collectionBooks(collectionId),
    queryFn: () => useCollectionsStore.getState().getCollectionBooks(collectionId),
  } satisfies UseQueryOptions<Book[]>;
}
