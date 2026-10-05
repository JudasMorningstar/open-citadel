import type { CatalogBook } from '@/services/gutenberg/records';
import { CATALOG_SHELVES } from '@/services/gutenberg/shelves';

/** What one shelf of the catalog has to show: still asked for, its books, or nothing to be had. */
export type ShelfState = { status: 'loading' } | { status: 'ready'; books: CatalogBook[] } | { status: 'failed' };

/** The shelves Free Books opens on. */
export const CATALOG_FIRST_SHELVES = 3;

/**
 * Whether Free Books can open on its shelves: whether the ones it opens on
 * are already in hand (cached from an earlier visit). If not it opens on a
 * skeleton and the shelves arrive under it.
 */
export function catalogPreviewReady(shelves: Record<string, ShelfState>): boolean {
  return CATALOG_SHELVES.slice(0, CATALOG_FIRST_SHELVES).every((shelf) => shelves[shelf.id]?.status === 'ready');
}
