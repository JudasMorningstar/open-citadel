import React from 'react';
import { View } from 'react-native';

import { FeedTileSkeleton } from '@/components/skeletons/feed-tile-skeleton';
import { ShelfHeadingSkeleton } from '@/components/skeletons/shelf-heading-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { ArticleTileSkeleton } from '@/features/blogs/components/article-tile-skeleton';

const TILES = [0, 1, 2];

/** The blogs side's shelves before they have mounted: a shelf of posts and a shelf of blogs, at their real sizes. */
export function BlogShelvesSkeleton({ label }: { label?: string }) {
  return (
    <SkeletonGroup label={label} className="gap-8">
      <View className="gap-4">
        <ShelfHeadingSkeleton />
        <View className="flex-row gap-4 pl-6">
          {TILES.map((i) => (
            <ArticleTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
          ))}
        </View>
      </View>
      <View className="gap-4">
        <ShelfHeadingSkeleton />
        <View className="flex-row gap-4 pl-6">
          {TILES.map((i) => (
            <FeedTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}
