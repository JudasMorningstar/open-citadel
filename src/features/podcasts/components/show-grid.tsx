import React from 'react';

import { TileGrid } from '@/components/tile-grid';
import { ShowTile } from '@/features/podcasts/components/show-tile';
import type { ShowTileData } from '@/features/podcasts/utils/show-tiles';

const keyOf = (item: ShowTileData) => item.id;

type ShowGridProps = {
  tiles: ShowTileData[];
  empty: React.ReactElement;
  bottomPadding: number;
  onOpen: (id: string) => void;
};

/** Shows two to a row: the followed ones, or a genre's chart. */
export function ShowGrid({ tiles, empty, bottomPadding, onOpen }: ShowGridProps) {
  const renderTile = React.useCallback(
    (item: ShowTileData, width: number) => (
      <ShowTile
        id={item.id}
        title={item.title}
        author={item.author}
        artworkUrl={item.artworkUrl}
        newCount={item.newCount}
        following={item.following}
        width={width}
        onPress={onOpen}
      />
    ),
    [onOpen],
  );
  return <TileGrid items={tiles} keyOf={keyOf} renderTile={renderTile} empty={empty} bottomPadding={bottomPadding} />;
}
