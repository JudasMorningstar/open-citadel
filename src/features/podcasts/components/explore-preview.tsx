import React from 'react';

import { ShelvesPreview, type PreviewShelf } from '@/components/shelves-preview';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { ShowTile } from '@/features/podcasts/components/show-tile';
import type { ChartState, FollowedCheck } from '@/features/podcasts/hooks/use-explore';
import { tileFromDiscovered } from '@/features/podcasts/utils/show-tiles';
import { EXPLORE_GENRES, type DiscoveredShow, type ExploreGenre } from '@/services/podcasts/discovery';

/** What fits on the first screen: three shelves, three tiles each (the third cut by the edge). */
const PREVIEW_GENRES = EXPLORE_GENRES.slice(0, 3);
const PREVIEW_TILES = 3;

const chartKey = (genre: ExploreGenre) => String(genre.id);

/** Whether the cache holds every chart the first screen draws, so `ExplorePreview` can stand in. */
export function explorePreviewReady(charts: Record<string, ChartState>): boolean {
  return PREVIEW_GENRES.every((genre) => charts[chartKey(genre)]?.status === 'ready');
}

type ExplorePreviewProps = {
  charts: Record<string, ChartState>;
  isFollowed: FollowedCheck;
  onOpen: (show: DiscoveredShow) => void;
  onViewAll: (genre: ExploreGenre) => void;
};

/** Explore's first screen from cached charts, while the drawer rises. See `ShelvesPreview`. */
export const ExplorePreview = React.memo(function ExplorePreview({ charts, isFollowed, onOpen, onViewAll }: ExplorePreviewProps) {
  const shelves: PreviewShelf[] = PREVIEW_GENRES.map((genre) => {
    const chart = charts[chartKey(genre)];
    const shows = chart?.status === 'ready' ? chart.shows.slice(0, PREVIEW_TILES) : [];
    return {
      key: chartKey(genre),
      title: genre.label,
      onViewAll: () => onViewAll(genre),
      tiles: shows.map((show) => {
        const tile = tileFromDiscovered(show, isFollowed(show));
        return (
          <ShowTile
            key={tile.id}
            id={tile.id}
            title={tile.title}
            author={tile.author}
            artworkUrl={tile.artworkUrl}
            following={tile.following}
            width={SHELF_TILE_WIDTH}
            onPress={() => onOpen(show)}
          />
        );
      }),
    };
  });
  return <ShelvesPreview shelves={shelves} />;
});
