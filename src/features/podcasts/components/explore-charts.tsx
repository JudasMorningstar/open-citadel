import React from 'react';

import { TransitionFlashList } from '@/components/navigation/transition-scroll';
import { PageFade } from '@/components/scroll-fades';
import { LIST_DRAW_DISTANCE } from '@/constants/theme';
import { ExploreFooter } from '@/features/podcasts/components/explore-footer';
import { ExploreShelf } from '@/features/podcasts/components/explore-shelf';
import type { ChartState, FollowedCheck } from '@/features/podcasts/hooks/use-explore';
import { EXPLORE_GENRES, type DiscoveredShow, type ExploreGenre } from '@/services/podcasts/discovery';

const genreKey = (genre: ExploreGenre) => String(genre.id);

type ExploreChartsProps = {
  charts: Record<string, ChartState>;
  isFollowed: FollowedCheck;
  bottomPadding: number;
  onOpen: (show: DiscoveredShow) => void;
  onViewAll: (genre: ExploreGenre) => void;
  onImport: () => void;
};

/**
 * Apple's charts, a shelf per genre, with the AntennaPod import at the foot.
 *
 * A FlashList of shelves, each shelf a horizontal FlashList of tiles, the
 * pattern FlashList v2 is built for: on first render it mounts only the first
 * shelf or two, and each shelf only the tiles on screen, so opening Explore
 * costs about what its skeleton did and the drawer starts moving at once.
 * Everything else is drawn a screen ahead as the page scrolls, never in
 * front of the reader and never as a batch popping in.
 */
export const ExploreCharts = React.memo(function ExploreCharts({ charts, isFollowed, bottomPadding, onOpen, onViewAll, onImport }: ExploreChartsProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: ExploreGenre }) => (
      <ExploreShelf genre={item} chart={charts[genreKey(item)]} isFollowed={isFollowed} onOpen={onOpen} onViewAll={onViewAll} />
    ),
    [charts, isFollowed, onOpen, onViewAll],
  );

  return (
    <PageFade>
      <TransitionFlashList
        data={EXPLORE_GENRES}
        keyExtractor={genreKey}
        renderItem={renderItem}
        extraData={charts}
        drawDistance={LIST_DRAW_DISTANCE}
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<ExploreFooter onImport={onImport} />}
      />
    </PageFade>
  );
});
