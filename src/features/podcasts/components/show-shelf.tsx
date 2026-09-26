import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { SHELF_TILE_WIDTH } from '@/features/podcasts/components/episode-shelf';
import { ShowTile } from '@/features/podcasts/components/show-tile';
import { showName, type ShowItem } from '@/services/podcasts/records';

type ShowShelfProps = {
  shows: ShowItem[];
  onPress: (showId: string) => void;
};

const keyOf = (show: ShowItem) => show.id;

/** The followed shows, those with something new first. */
export const ShowShelf = React.memo(function ShowShelf({ shows, onPress }: ShowShelfProps) {
  const renderTile = React.useCallback(
    (show: ShowItem) => (
      <ShowTile
        id={show.id}
        title={showName(show)}
        author={show.author}
        artworkUrl={show.imageUrl}
        newCount={show.newCount}
        width={SHELF_TILE_WIDTH}
        onPress={onPress}
      />
    ),
    [onPress],
  );
  return <ShelfRow items={shows} keyOf={keyOf} renderTile={renderTile} />;
});
