import { useQueries } from '@tanstack/react-query';
import React from 'react';
import type { ViewToken } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { createShelfPreviewQueryOptions } from '@/query-manager/gutenberg';
import type { CatalogBook, CatalogPage } from '@/services/gutenberg/records';
import { CATALOG_SHELVES, type CatalogShelf } from '@/services/gutenberg/shelves';

export type ShelfState = { status: 'loading' } | { status: 'ready'; books: CatalogBook[] } | { status: 'failed' };

/** How many of a shelf's first page its row on Explore draws; "View all" has the rest. */
export const SHELF_PREVIEW_SIZE = 12;

/** The shelves asked for as Explore lands, before anything has been scrolled. */
const FIRST_SHELVES = new Set(CATALOG_SHELVES.slice(0, 3).map((shelf) => shelf.id));

const LOADING: ShelfState = { status: 'loading' };
const FAILED: ShelfState = { status: 'failed' };
/**
 * One state object per page of data, kept for as long as the page is. When one
 * shelf arrives, every other shelf is handed the very object it had before, so
 * its memoized row does not redraw, and its horizontal list is not given a
 * new array of the same books.
 */
const readyStates = new WeakMap<CatalogPage, ShelfState>();

function shelfState(result: { data?: CatalogPage; isError: boolean }): ShelfState {
  const { data, isError } = result;
  if (!data) return isError ? FAILED : LOADING;
  let ready = readyStates.get(data);
  if (!ready) {
    ready = { status: 'ready', books: data.books.slice(0, SHELF_PREVIEW_SIZE) };
    readyStates.set(data, ready);
  }
  return ready;
}

/** Module level, so the query layer can keep one answer until a shelf actually changes. */
function combineShelves(results: { data?: CatalogPage; isError: boolean }[]): Record<string, ShelfState> {
  return Object.fromEntries(CATALOG_SHELVES.map((shelf, i) => [shelf.id, shelfState(results[i])]));
}

/**
 * The shelves Explore asks for as it lands, asked for at the tap that opens
 * it instead: the page then lands on books rather than on a round trip.
 */
export function prefetchFirstShelves(): void {
  for (const shelf of CATALOG_SHELVES) {
    if (FIRST_SHELVES.has(shelf.id)) void queryClient.prefetchQuery(createShelfPreviewQueryOptions(shelf));
  }
}

/**
 * Explore's shelves, each asked for only once it has been on screen.
 *
 * Sixteen shelves are not fetched because a drawer opened, which would be
 * sixteen requests to Samwell Cloud for rows nobody may scroll to: the first
 * few are, and the rest as they scroll into view. The list reports
 * what it shows through `onViewableItemsChanged`, and the set of shelves seen
 * only grows, so scrolling back never asks again (the cache answers).
 */
export function useCatalogShelves(landed: boolean) {
  const [seen, setSeen] = React.useState<ReadonlySet<string>>(FIRST_SHELVES);

  const shelves = useQueries({
    queries: CATALOG_SHELVES.map((shelf) => createShelfPreviewQueryOptions(shelf, { enabled: landed && seen.has(shelf.id) })),
    combine: combineShelves,
  });

  // Stable for the list's lifetime: FlashList reads it once.
  const onViewableItemsChanged = React.useCallback(({ viewableItems }: { viewableItems: ViewToken<CatalogShelf>[] }) => {
    setSeen((prev) => {
      const fresh = viewableItems.map((token) => token.item?.id).filter((id): id is string => !!id && !prev.has(id));
      return fresh.length > 0 ? new Set([...prev, ...fresh]) : prev;
    });
  }, []);

  return { shelves, onViewableItemsChanged };
}
