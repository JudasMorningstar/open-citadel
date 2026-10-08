import { useQueries, useQuery } from '@tanstack/react-query';
import React from 'react';

import { looksLikeLink } from '@/features/podcasts/utils/links';
import { createChartQueryOptions, createSearchQueryOptions } from '@/query-manager/discovery';
import { createFollowedShowsQueryOptions } from '@/query-manager/podcasts';
import { EXPLORE_GENRES, type DiscoveredShow } from '@/services/podcasts/discovery';

export type ChartState = { status: 'loading' } | { status: 'ready'; shows: DiscoveredShow[] } | { status: 'failed' };

/** How many of a chart its shelf on Explore draws; the genre's "View all" has the rest. */
export const CHART_SHELF_SIZE = 10;

function chartState(query: { data?: DiscoveredShow[]; isError: boolean }, size?: number): ChartState {
  if (query.data) return { status: 'ready', shows: size ? query.data.slice(0, size) : query.data };
  return query.isError ? { status: 'failed' } : { status: 'loading' };
}

/** Module level, so the query layer can keep one answer until a chart actually changes. */
function combineCharts(results: { data?: DiscoveredShow[]; isError: boolean }[]): Record<string, ChartState> {
  return Object.fromEntries(
    EXPLORE_GENRES.map((genre, i) => [String(genre.id), chartState(results[i], CHART_SHELF_SIZE)]),
  );
}

/**
 * Every Explore chart, keyed by genre. They are requested together, and the
 * directory client lets three through at a time in the order they were
 * asked, so the shelves at the top fill first.
 */
export function useExploreCharts(enabled: boolean): Record<string, ChartState> {
  return useQueries({
    queries: EXPLORE_GENRES.map((genre) => createChartQueryOptions(genre.id, { enabled })),
    combine: combineCharts,
  });
}

/** One genre's whole chart, for its "View all". Shares the shelf's cache entry. */
export function useChart(genreId: number | null): ChartState {
  const { data, isError } = useQuery(createChartQueryOptions(genreId));
  // One object per answer, not per render: everything downstream (the grid's
  // tiles, its press lookup) is memoized on it.
  return React.useMemo(() => chartState({ data, isError }), [data, isError]);
}

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; shows: DiscoveredShow[] }
  | { status: 'failed' };

/** Apple's directory, searched once typing pauses. A newer query cancels an older one. */
export function useExploreSearch(query: string): SearchState {
  const term = query.trim();
  const active = term.length > 0 && !looksLikeLink(term);
  const { data, isError } = useQuery(createSearchQueryOptions(term, { enabled: active }));
  // One object per answer, not per render, so the results list only redraws when they change.
  return React.useMemo((): SearchState => {
    if (!active) return { status: 'idle' };
    if (data) return { status: 'ready', shows: data };
    return isError ? { status: 'failed' } : { status: 'loading' };
  }, [active, data, isError]);
}

export type FollowedCheck = (show: Pick<DiscoveredShow, 'feedUrl' | 'title'>) => boolean;

/** Whether a show Explore found is one already followed, so it can say "Following". */
export function useFollowedCheck(): FollowedCheck {
  const { data } = useQuery(createFollowedShowsQueryOptions());
  return React.useCallback(
    (show) =>
      !!data &&
      ((show.feedUrl ? data.feedUrls.has(show.feedUrl) : false) || data.titles.has(show.title.trim().toLowerCase())),
    [data],
  );
}
