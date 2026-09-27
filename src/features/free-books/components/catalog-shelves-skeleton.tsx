import React from 'react';
import { View } from 'react-native';

import { BookTileSkeleton } from '@/components/skeletons/book-tile-skeleton';
import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/constants/theme';

const SHELVES = [0, 1, 2];
const TILES = [0, 1, 2];

/** The free books while the drawer rises: shelves at their real size. */
export function CatalogShelvesSkeleton() {
  return (
    <SkeletonGroup label="Loading free books" className="pt-4">
      {SHELVES.map((shelf) => (
        <View key={shelf} className="mb-8 gap-4">
          <View className="flex-row items-center justify-between px-6">
            <SkeletonBar className="h-6 w-36" />
            <SkeletonBar className="h-7 w-20" />
          </View>
          <View className="flex-row gap-4 px-6">
            {TILES.map((i) => (
              <BookTileSkeleton key={i} width={SHELF_TILE_WIDTH} titleLines={1} />
            ))}
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
