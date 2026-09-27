import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import React from 'react';

import { PullToSync, type PullScrollProps } from '@/components/pull-to-sync';
import { LIST_DRAW_DISTANCE } from '@/constants/theme';
import { EpisodeSeparator } from '@/features/podcasts/components/episode-separator';
import { NEW_EPISODES_PULL_LABELS, renderNewEpisodesIndicator } from '@/features/podcasts/components/new-episodes-indicator';
import type { EpisodeItem } from '@/services/podcasts/records';

type ShowEpisodeListProps = {
  episodes: EpisodeItem[];
  renderItem: ListRenderItem<EpisodeItem>;
  header: React.ReactElement;
  empty: React.ReactElement;
  bottomPadding: number;
  /** Only a stored show can be checked; a preview is fetched as it opens. */
  canRefresh: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

const keyExtractor = (item: EpisodeItem) => item.id;

/**
 * A show's episodes under the same pull the podcasts home has: the gap, the
 * bar loader and "PULL FOR NEW EPISODES", not the platform's round spinner.
 */
export function ShowEpisodeList({
  episodes,
  renderItem,
  header,
  empty,
  bottomPadding,
  canRefresh,
  refreshing,
  onRefresh,
}: ShowEpisodeListProps) {
  const renderScroller = ({ onScroll, refreshControl }: PullScrollProps) => (
    <FlashList
      data={episodes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ItemSeparatorComponent={EpisodeSeparator}
      drawDistance={LIST_DRAW_DISTANCE}
      ListHeaderComponent={header}
      ListEmptyComponent={empty}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      refreshControl={refreshControl}
    />
  );

  return (
    <PullToSync
      running={refreshing}
      onSync={onRefresh}
      enabled={canRefresh}
      labels={NEW_EPISODES_PULL_LABELS}
      renderIndicator={renderNewEpisodesIndicator}
      renderScroller={renderScroller}
    />
  );
}
