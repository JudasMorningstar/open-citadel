import { useRouter } from 'expo-router';
import React from 'react';

import { useChart, useFollowedCheck } from '@/features/podcasts/hooks/use-explore';
import { openDiscoveredShowPage } from '@/features/podcasts/hooks/use-explore-screen';
import { discoveredKey, tileFromDiscovered } from '@/features/podcasts/utils/show-tiles';
import { EXPLORE_GENRES } from '@/services/podcasts/discovery';

/** A genre's whole chart, from its Explore shelf's VIEW ALL. */
export function useGenreScreen(param: string | undefined) {
  const router = useRouter();
  const genre = EXPLORE_GENRES.find((g) => (g.id == null ? 'all' : String(g.id)) === param) ?? EXPLORE_GENRES[0];
  const chart = useChart(genre.id);
  const isFollowed = useFollowedCheck();
  const shows = React.useMemo(() => (chart.status === 'ready' ? chart.shows : []), [chart]);
  const tiles = React.useMemo(() => shows.map((show) => tileFromDiscovered(show, isFollowed(show))), [shows, isFollowed]);
  const byId = React.useMemo(() => new Map(shows.map((show) => [discoveredKey(show), show])), [shows]);

  const open = React.useCallback(
    (id: string) => {
      const show = byId.get(id);
      if (!show) return;
      openDiscoveredShowPage(router, show);
    },
    [byId, router],
  );

  return {
    title: genre.label,
    tiles,
    loading: chart.status === 'loading',
    emptyText: chart.status === 'failed' ? 'This chart could not be loaded. Check your connection.' : 'Nothing on this chart yet.',
    open,
    back: () => router.back(),
  };
}
