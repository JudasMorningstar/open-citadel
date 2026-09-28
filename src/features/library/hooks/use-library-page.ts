import React from 'react';

import { HUB, useHubStore } from '@/stores/hub';
import { usePodcastPrefs, type LibraryTab } from '@/stores/podcast-prefs';

/**
 * The Library shell's state: which side is showing, whether the podcasts side
 * has been opened yet (it is not mounted until then, so someone who only
 * reads never pays for it), and the header's way to the hub's other pages.
 * The side last left open is remembered, and the app comes back to it.
 */
export function useLibraryPage() {
  const tab = usePodcastPrefs((s) => s.libraryTab);
  const [podcastsMounted, setPodcastsMounted] = React.useState(tab === 'podcasts');

  const changeTab = React.useCallback((next: LibraryTab) => {
    if (next === 'podcasts') setPodcastsMounted(true);
    usePodcastPrefs.getState().set('libraryTab', next);
  }, []);
  const openTimeline = React.useCallback(() => useHubStore.getState().goTo(HUB.timeline), []);
  const openSamwell = React.useCallback(() => useHubStore.getState().goTo(HUB.samwell), []);

  return { tab, podcastsMounted, changeTab, openTimeline, openSamwell };
}
