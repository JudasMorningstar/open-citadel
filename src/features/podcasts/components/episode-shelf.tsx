import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import type { TileBadgeIcon } from '@/components/tile-badge';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { EpisodeTile } from '@/features/podcasts/components/episode-tile';
import type { EpisodeItem } from '@/services/podcasts/records';


type EpisodeShelfProps = {
  episodes: EpisodeItem[];
  onPress: (episodeId: string) => void;
  onLongPress: (episode: EpisodeItem) => void;
  onPlay: (episodeId: string) => void;
  /** The mark every tile on this shelf carries, if any. */
  badgeIcon?: TileBadgeIcon;
};

const keyOf = (episode: EpisodeItem) => episode.id;

/** A horizontal row of episodes. At most a shelf's worth; "View all" has the rest. */
export const EpisodeShelf = React.memo(function EpisodeShelf({
  episodes,
  onPress,
  onLongPress,
  onPlay,
  badgeIcon,
}: EpisodeShelfProps) {
  const renderTile = React.useCallback(
    (episode: EpisodeItem) => (
      <EpisodeTile
        episode={episode}
        width={SHELF_TILE_WIDTH}
        onPress={onPress}
        onLongPress={onLongPress}
        onPlay={onPlay}
        badgeIcon={badgeIcon}
      />
    ),
    [badgeIcon, onLongPress, onPlay, onPress],
  );
  return <ShelfRow items={episodes} keyOf={keyOf} renderTile={renderTile} />;
});
