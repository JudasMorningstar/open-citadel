import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { ThemedText } from '@/components/themed-text';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { ShowTile } from '@/features/podcasts/components/show-tile';
import { FeedTileSkeleton } from '@/components/skeletons/feed-tile-skeleton';
import type { ChartState, FollowedCheck } from '@/features/podcasts/hooks/use-explore';
import { tileFromDiscovered, type ShowTileData } from '@/features/podcasts/utils/show-tiles';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { DiscoveredShow, ExploreGenre } from '@/services/podcasts/discovery';

type ExploreShelfProps = {
  genre: ExploreGenre;
  chart: ChartState;
  isFollowed: FollowedCheck;
  onOpen: (show: DiscoveredShow) => void;
  onViewAll: (genre: ExploreGenre) => void;
};

const PLACEHOLDERS = [0, 1, 2];
const keyOf = (tile: ShowTileData) => tile.id;

/** Three tile shapes, pulsing together, while the chart is on its way. */
function LoadingRow() {
  return (
    <SkeletonGroup className="flex-row gap-4 px-6">
      {PLACEHOLDERS.map((i) => (
        <FeedTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
      ))}
    </SkeletonGroup>
  );
}

/**
 * One genre's chart as a shelf of its top few, with the shows already followed
 * marked, and VIEW ALL for the whole chart, laid out like every Library shelf.
 */
export const ExploreShelf = React.memo(function ExploreShelf({ genre, chart, isFollowed, onOpen, onViewAll }: ExploreShelfProps) {
  const viewAll = React.useCallback(() => onViewAll(genre), [genre, onViewAll]);
  const tokens = useThemeTokens();
  const shows = chart.status === 'ready' ? chart.shows : null;
  const tiles = React.useMemo(
    () => shows?.map((show) => tileFromDiscovered(show, isFollowed(show))) ?? null,
    [shows, isFollowed],
  );
  const byId = React.useMemo(() => new Map((shows ?? []).map((s) => [tileFromDiscovered(s, false).id, s])), [shows]);
  const open = React.useCallback(
    (id: string) => {
      const show = byId.get(id);
      if (show) onOpen(show);
    },
    [byId, onOpen],
  );
  const renderTile = React.useCallback(
    (tile: ShowTileData) => (
      <ShowTile
        id={tile.id}
        title={tile.title}
        author={tile.author}
        artworkUrl={tile.artworkUrl}
        following={tile.following}
        width={SHELF_TILE_WIDTH}
        onPress={open}
      />
    ),
    [open],
  );

  const body =
    chart.status === 'failed' ? (
      <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} className="px-6">
        This chart could not be loaded. Check your connection.
      </ThemedText>
    ) : tiles ? (
      <ShelfRow items={tiles} keyOf={keyOf} renderTile={renderTile} />
    ) : (
      <LoadingRow />
    );

  return (
    <ShelfSection title={genre.label} onViewAll={viewAll}>
      {body}
    </ShelfSection>
  );
});
