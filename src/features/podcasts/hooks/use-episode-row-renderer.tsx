import React from 'react';

import { EpisodeRow } from '@/features/podcasts/components/episode-row';
import type { useEpisodeActions } from '@/features/podcasts/hooks/use-episode-actions';
import * as actions from '@/services/podcasts/actions';
import type { EpisodeItem } from '@/services/podcasts/records';

type EpisodeActions = ReturnType<typeof useEpisodeActions>;

/**
 * A list's `renderItem` for episode rows, with every row wired the same way
 * wherever episodes are listed. Stable across renders, so recycled rows keep
 * their memo.
 */
export function useEpisodeRowRenderer(episodeActions: EpisodeActions, { withShow = false } = {}) {
  const { openEpisode, openMenu, play } = episodeActions;
  return React.useCallback(
    ({ item }: { item: EpisodeItem }) => (
      <EpisodeRow
        episode={item}
        withShow={withShow}
        onPress={openEpisode}
        onMenu={openMenu}
        onPlay={play}
        onDownload={actions.downloadOne}
        onRemoveDownload={actions.removeDownloadOne}
      />
    ),
    [openEpisode, openMenu, play, withShow],
  );
}
