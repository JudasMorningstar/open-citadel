import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { useAntennaPodImport } from '@/features/podcasts/hooks/use-antennapod-import';
import { useEpisodeActions } from '@/features/podcasts/hooks/use-episode-actions';
import { usePodcastHome } from '@/features/podcasts/hooks/use-podcast-home';
import type { PodcastSection } from '@/features/podcasts/utils/sections';
import { createPodcastSectionQueryOptions } from '@/query-manager/podcasts';
import { refreshAllShows } from '@/services/podcasts/refresh';
import { usePodcastPrefs } from '@/stores/podcast-prefs';

/** What the podcasts side draws: an import running, nothing for one frame, the welcome, or the shelves. */
export type PodcastsPageView = 'import' | 'loading' | 'welcome' | 'home';


/**
 * The podcasts side of the Library: which view it shows, and what its
 * buttons, pull and shelves do.
 *
 * Opening it is also when followed shows are checked for new episodes (those
 * past the refresh interval only; a pull checks every one), which is the
 * moment the listener would look for them.
 */
export function usePodcastsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const home = usePodcastHome();
  const importer = useAntennaPodImport();
  const episodes = useEpisodeActions();
  // A pull checks every show now, not only those past the interval. A mutation,
  // so its pending state is the spinner and a second pull joins the first.
  const pull = useMutation({ mutationFn: () => refreshAllShows(true) });

  React.useEffect(() => {
    void refreshAllShows(false);
  }, []);

  const openExplore = React.useCallback(() => router.push('/podcasts/explore'), [router]);
  const startFresh = React.useCallback(() => {
    usePodcastPrefs.getState().set('onboarding', 'fresh');
    router.push('/podcasts/explore');
  }, [router]);
  const refresh = React.useCallback(() => {
    if (!pull.isPending) pull.mutate();
  }, [pull]);
  const viewAll = React.useCallback(
    (section: PodcastSection) => {
      void queryClient.prefetchQuery(createPodcastSectionQueryOptions(section));
      router.push({ pathname: '/podcasts/section/[type]', params: { type: section } });
    },
    [queryClient, router],
  );

  // Nothing here yet: no show followed, and no episode started, queued,
  // downloaded or kept. That is the welcome, whenever it is true: leaving
  // Explore without following anything comes back to it, as leaving the free
  // books' or the blogs' Explore does. Local data, one render away: nothing is
  // drawn for that one frame rather than a skeleton of it.
  const empty = home.shows.length === 0 && Object.values(home.shelves).every((shelf) => shelf.length === 0);
  const view: PodcastsPageView = importer.active ? 'import' : !home.loaded ? 'loading' : empty ? 'welcome' : 'home';

  return {
    view,
    home,
    importer,
    episodes,
    pulling: pull.isPending,
    refresh,
    openExplore,
    startFresh,
    viewAll,
  };
}
