import React from 'react';
import { View } from 'react-native';

import { FeedTileSkeleton } from '@/components/skeletons/feed-tile-skeleton';
import { HeroCardSkeleton } from '@/components/skeletons/hero-card-skeleton';
import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { SHELF_TILE_WIDTH } from '@/constants/theme';

const TILE_PADDING = 16;
const TILES = [0, 1, 2];

/** A shelf's title and its VIEW ALL card. */
function ShelfHeading() {
  return (
    <View className="flex-row items-center justify-between px-6">
      <SkeletonBar className="h-6 w-44" />
      <SkeletonBar className="h-7 w-20" />
    </View>
  );
}

/** A post tile before it has arrived, at `ArticleTile`'s real size: its picture, blog, three title lines and date. */
function ArticleTileSkeleton({ width }: { width: number }) {
  const art = width - TILE_PADDING * 2;
  return (
    <View className="gap-3 bg-tile p-4" style={{ width }}>
      <View className="bg-skeleton" style={{ width: art, height: art }} />
      <View className="gap-1">
        <View className="h-4 justify-center">
          <SkeletonBar className="h-2.5 w-1/2" />
        </View>
        <View className="h-[72px] justify-center gap-2">
          <SkeletonBar className="h-3.5 w-4/5" />
          <SkeletonBar className="h-3.5 w-3/5" />
        </View>
        <View className="h-5 justify-center">
          <SkeletonBar className="h-2.5 w-1/3" />
        </View>
      </View>
    </View>
  );
}

/**
 * The Blogs page while its library is read, drawn the way the books' and the
 * podcasts' are: the Continue Reading card, then a shelf of posts and a shelf
 * of blogs, at their real sizes so nothing moves when the page fills. One
 * `SkeletonGroup`, so the whole page pulses as one node.
 */
export function BlogsHomeSkeleton() {
  return (
    <SkeletonGroup label="Loading your blogs" className="gap-8 pt-6">
      <View className="gap-4">
        <ShelfHeading />
        <HeroCardSkeleton mediaAspect={1} />
      </View>
      <View className="gap-4">
        <ShelfHeading />
        <View className="flex-row gap-4 pl-6">
          {TILES.map((i) => (
            <ArticleTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
          ))}
        </View>
      </View>
      <View className="gap-4">
        <ShelfHeading />
        <View className="flex-row gap-4 pl-6">
          {TILES.map((i) => (
            <FeedTileSkeleton key={i} width={SHELF_TILE_WIDTH} />
          ))}
        </View>
      </View>
    </SkeletonGroup>
  );
}
