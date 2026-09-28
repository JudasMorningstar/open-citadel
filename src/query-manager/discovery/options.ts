import type { UseQueryOptions } from '@tanstack/react-query';

import { discoveryKeys } from '@/query-manager/discovery/keys';
import { searchShows, topShows, type DiscoveredShow } from '@/services/podcasts/discovery';

type Options<T, TData = T> = Omit<UseQueryOptions<T, Error, TData>, 'queryKey' | 'queryFn'>;

/**
 * How many shows a chart holds. One fetch serves both the shelf on Explore
 * (which shows the first few) and the genre's "View all", so opening it is
 * instant.
 */
export const CHART_LIMIT = 50;

/** A genre's chart. Charts move daily, not by the minute: fresh for six hours, kept for a day. */
export function createChartQueryOptions<TData = DiscoveredShow[]>(
  genreId: number | null,
  options?: Options<DiscoveredShow[], TData>,
) {
  return {
    staleTime: 6 * 60 * 60_000,
    gcTime: 24 * 60 * 60_000,
    ...options,
    queryKey: discoveryKeys.chart(genreId, CHART_LIMIT),
    queryFn: ({ signal }) => topShows(genreId, CHART_LIMIT, signal),
  } satisfies UseQueryOptions<DiscoveredShow[], Error, TData>;
}

/** A search of Apple's directory. Cancelled when a newer query replaces it. */
export function createSearchQueryOptions(term: string, options?: Options<DiscoveredShow[]>) {
  return {
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    ...options,
    queryKey: discoveryKeys.search(term),
    queryFn: ({ signal }) => searchShows(term, signal),
  } satisfies UseQueryOptions<DiscoveredShow[]>;
}
