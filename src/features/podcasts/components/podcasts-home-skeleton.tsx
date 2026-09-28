import React from 'react';
import { View } from 'react-native';

import { HeroCardSkeleton } from '@/components/skeletons/hero-card-skeleton';
import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/features/podcasts/components/episode-shelf';
import { ShowTileSkeleton } from '@/features/podcasts/components/show-tile-skeleton';

/** A shelf's title and its VIEW ALL card. */
function ShelfHeading() {
  return (
    <View className="flex-row items-center justify-between px-6">
      <SkeletonBar className="h-6 w-44" />
      <SkeletonBar className="h-7 w-20" />
    </View>
  );
}

const TILES = [0, 1, 2];

/**
 * The Podcasts page while its library is read, drawn the way the books side's
 * `LibrarySkeleton` is: the hero card, then two shelves, at their real sizes so
 * nothing moves when the page fills.
 */
export function PodcastsHomeSkeleton() {
  return (
    <SkeletonGroup label="Loading your podcasts" className="gap-8 pt-6">
      <View className="gap-4">
        <ShelfHeading />
        <HeroCardSkeleton mediaAspect={1} />
      </View>
      {[0, 1].map((shelf) => (
        <View key={shelf} className="gap-4">
          <ShelfHeading />
          <View className="flex-row gap-4 pl-6">
            {TILES.map((i) => (
              <ShowTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
