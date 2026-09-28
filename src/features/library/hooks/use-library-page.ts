import React from 'react';

import { HUB, useHubStore } from '@/stores/hub';
import { usePodcastPrefs, type LibraryTab } from '@/stores/podcast-prefs';

/**
 * The Library shell's state: which side is showing, which sides have been
 * opened (a side is not mounted until then, so someone who only reads books
 * never pays for podcasts or blogs), and the header's way to the hub's other
 * pages. The side last left open is remembered, and the app comes back to it.
 */
export function useLibraryPage() {
  const tab = usePodcastPrefs((s) => s.libraryTab);
  const [mounted, setMounted] = React.useState<Record<LibraryTab, boolean>>(() => ({
    books: true,
    podcasts: tab === 'podcasts',
    blogs: tab === 'blogs',
  }));

  const changeTab = React.useCallback((next: LibraryTab) => {
    setMounted((prev) => (prev[next] ? prev : { ...prev, [next]: true }));
    usePodcastPrefs.getState().set('libraryTab', next);
  }, []);
  const openTimeline = React.useCallback(() => useHubStore.getState().goTo(HUB.timeline), []);
  const openSamwell = React.useCallback(() => useHubStore.getState().goTo(HUB.samwell), []);

  return { tab, mounted, changeTab, openTimeline, openSamwell };
}
