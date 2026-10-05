import React from 'react';

import { ShelfStack } from '@/components/shelf-stack';
import { ExploreFooter } from '@/features/podcasts/components/explore-footer';
import { ExploreShelf } from '@/features/podcasts/components/explore-shelf';
import { EXPLORE_FIRST_SHELVES } from '@/features/podcasts/utils/explore-preview';
import type { ChartState, FollowedCheck } from '@/features/podcasts/hooks/use-explore';
import { EXPLORE_GENRES, type DiscoveredShow, type ExploreGenre } from '@/services/podcasts/discovery';

const genreKey = (genre: ExploreGenre) => String(genre.id);

type ExploreChartsProps = {
  charts: Record<string, ChartState>;
  isFollowed: FollowedCheck;
  bottomPadding: number;
  /** The drawer has finished rising. */
  ready: boolean;
  onOpen: (show: DiscoveredShow) => void;
  onViewAll: (genre: ExploreGenre) => void;
  onImport: () => void;
};

/**
 * Apple's charts, a shelf per genre, with the AntennaPod import at the foot.
 *
 * A `ShelfStack`: the three shelves the page opens on at once, the rest a
 * shelf at a time behind them, and each shelf a horizontal FlashList drawing
 * only the tiles on screen.
 */
export const ExploreCharts = React.memo(function ExploreCharts({ charts, isFollowed, bottomPadding, ready, onOpen, onViewAll, onImport }: ExploreChartsProps) {
  const renderShelf = React.useCallback(
    (genre: ExploreGenre) => (
      <ExploreShelf genre={genre} chart={charts[genreKey(genre)]} isFollowed={isFollowed} onOpen={onOpen} onViewAll={onViewAll} />
    ),
    [charts, isFollowed, onOpen, onViewAll],
  );

  return (
    <ShelfStack
      shelves={EXPLORE_GENRES}
      keyOf={genreKey}
      renderShelf={renderShelf}
      first={EXPLORE_FIRST_SHELVES}
      ready={ready}
      bottomPadding={bottomPadding}
      footer={<ExploreFooter onImport={onImport} />}
    />
  );
});
