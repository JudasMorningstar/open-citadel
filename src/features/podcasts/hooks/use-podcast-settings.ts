import React from 'react';
import { useShallow } from 'zustand/shallow';

import { showToast } from '@/components/toast/toast-provider';
import { exportOpml } from '@/services/podcasts/opml';
import { usePodcastPrefs, type PodcastPrefs } from '@/stores/podcast-prefs';

/**
 * The app-wide podcast settings: the values drawn, a setter bound to each,
 * and exporting the followed shows as OPML.
 */
export function usePodcastSettings() {
  // Only the fields drawn: the prefs store also holds the playing episode,
  // which changes on every track.
  const prefs = usePodcastPrefs(
    useShallow((s) => ({
      skipBackSec: s.skipBackSec,
      skipForwardSec: s.skipForwardSec,
      newEpisodesAction: s.newEpisodesAction,
      refreshIntervalHours: s.refreshIntervalHours,
      autoDownload: s.autoDownload,
      autoDeletePlayed: s.autoDeletePlayed,
    })),
  );
  /** A setter for one pref, for a control's `onChange`. */
  const bind = React.useCallback(
    <K extends keyof PodcastPrefs>(key: K) =>
      (value: PodcastPrefs[K]) =>
        usePodcastPrefs.getState().set(key, value),
    [],
  );
  const exportShows = React.useCallback(async () => {
    const count = await exportOpml();
    if (count === 0) showToast({ message: 'Follow a show first, then export.' });
  }, []);

  return { prefs, bind, exportShows: () => void exportShows() };
}
