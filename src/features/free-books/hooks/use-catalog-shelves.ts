import { useQueries } from '@tanstack/react-query';
import React from 'react';

import { CATALOG_FIRST_SHELVES, type ShelfState } from '@/features/free-books/utils/catalog-preview';
import { queryClient } from '@/lib/query-client';
import { createShelfPreviewQueryOptions } from '@/query-manager/gutenberg';
import type { CatalogPage } from '@/services/gutenberg/records';
import { CATALOG_SHELVES } from '@/services/gutenberg/shelves';

/** The shelves asked for as Explore lands, before anything has been scrolled. */
const FIRST_SHELVES = new Set(CATALOG_SHELVES.slice(0, CATALOG_FIRST_SHELVES).map((shelf) => shelf.id));

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
    ready = { status: 'ready', books: data.books };
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
 * Explore's shelves, each asked for only once the page has come near it.
 *
 * Sixteen shelves are not fetched because a drawer opened, which would be
 * sixteen requests to Samwell Cloud for rows nobody may scroll to: the first
 * few are, and the rest as the page is scrolled towards them. The stack
 * reports how many shelves it has drawn through `onDrawn`, and that count
 * only grows, so scrolling back never asks again (the cache answers).
 */
export function useCatalogShelves(landed: boolean) {
  const [drawn, setDrawn] = React.useState(FIRST_SHELVES.size);

  const shelves = useQueries({
    queries: CATALOG_SHELVES.map((shelf, index) => createShelfPreviewQueryOptions(shelf, { enabled: landed && index < drawn })),
    combine: combineShelves,
  });

  // Stable for the stack's lifetime, so it is not a reason to draw again.
  const onDrawn = React.useCallback((count: number) => setDrawn((current) => Math.max(current, count)), []);

  return { shelves, onDrawn };
}
