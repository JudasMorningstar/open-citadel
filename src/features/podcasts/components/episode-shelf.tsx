import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { EpisodeTile } from '@/features/podcasts/components/episode-tile';
import type { EpisodeItem } from '@/services/podcasts/records';

/** The book shelves' tile width, so the two libraries' shelves line up. */
export const SHELF_TILE_WIDTH = 170;

type EpisodeShelfProps = {
  episodes: EpisodeItem[];
  onPress: (episodeId: string) => void;
  onLongPress: (episode: EpisodeItem) => void;
  onPlay: (episodeId: string) => void;
};

const keyOf = (episode: EpisodeItem) => episode.id;

/** A horizontal row of episodes. At most a shelf's worth; "View all" has the rest. */
export const EpisodeShelf = React.memo(function EpisodeShelf({ episodes, onPress, onLongPress, onPlay }: EpisodeShelfProps) {
  const renderTile = React.useCallback(
    (episode: EpisodeItem) => (
      <EpisodeTile episode={episode} width={SHELF_TILE_WIDTH} onPress={onPress} onLongPress={onLongPress} onPlay={onPlay} />
    ),
    [onLongPress, onPlay, onPress],
  );
  return <ShelfRow items={episodes} keyOf={keyOf} renderTile={renderTile} />;
});
