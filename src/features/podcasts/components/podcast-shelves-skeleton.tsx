import React from 'react';
import { View } from 'react-native';

import { FeedTileSkeleton } from '@/components/skeletons/feed-tile-skeleton';
import { ShelfHeadingSkeleton } from '@/components/skeletons/shelf-heading-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/constants/theme';

const SHELVES = [0, 1];
const TILES = [0, 1, 2];

/** The podcasts side's shelves before they have mounted: two of them, at their real sizes. */
export function PodcastShelvesSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="gap-8">
      {SHELVES.map((shelf) => (
        <View key={shelf} className="gap-4">
          <ShelfHeadingSkeleton />
          <View className="flex-row gap-4 pl-6">
            {TILES.map((i) => (
              <FeedTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
