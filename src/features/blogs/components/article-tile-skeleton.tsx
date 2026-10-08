import React from 'react';
import { View } from 'react-native';

import { SkeletonBar } from '@/components/skeletons/skeleton-group';

const TILE_PADDING = 16;

/** A post tile before it has arrived, at `ArticleTile`'s real size: its picture, blog, three title lines and date. */
export function ArticleTileSkeleton({ width }: { width: number }) {
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
