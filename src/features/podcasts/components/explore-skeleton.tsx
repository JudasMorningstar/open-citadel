import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/features/podcasts/components/episode-shelf';
import { ShowTileSkeleton } from '@/features/podcasts/components/show-tile-skeleton';

const SHELVES = [0, 1, 2];
const TILES = [0, 1, 2];

/** Explore while the drawer rises: genre shelves at their real size. */
export function ExploreSkeleton() {
  return (
    <SkeletonGroup label="Loading the charts" className="pt-4">
      {SHELVES.map((shelf) => (
        <View key={shelf} className="mb-8 gap-4">
          <View className="flex-row items-center justify-between px-6">
            <SkeletonBar className="h-6 w-36" />
            <SkeletonBar className="h-7 w-20" />
          </View>
          <View className="flex-row gap-4 px-6">
            {TILES.map((i) => (
              <ShowTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
