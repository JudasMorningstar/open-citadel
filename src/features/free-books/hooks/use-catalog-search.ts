import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { createCatalogSearchQueryOptions } from '@/query-manager/gutenberg';
import type { CatalogBook } from '@/services/gutenberg/records';

export type CatalogSearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; books: CatalogBook[] }
  | { status: 'failed' };

/**
 * Project Gutenberg's catalogue, searched once typing pauses: one page of
 * results per search. A newer term cancels an older one.
 */
export function useCatalogSearch(query: string): CatalogSearchState {
  const term = query.trim();
  const active = term.length > 0;
  const { data, isError } = useQuery(createCatalogSearchQueryOptions(term, { enabled: active }));
  // One object per answer, not per render, so the results list only redraws when they change.
  return React.useMemo((): CatalogSearchState => {
    if (!active) return { status: 'idle' };
    if (data) return { status: 'ready', books: data.books };
    return isError ? { status: 'failed' } : { status: 'loading' };
  }, [active, data, isError]);
}
