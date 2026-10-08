import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { contentColumn } from '@/constants/theme';

const TILES = [0, 1, 2, 3];

/** An episode's page before it has landed, at `EpisodeHero`'s sizes, then the first lines of its notes. */
export function EpisodePageSkeleton() {
  return (
    <SkeletonGroup label="Loading the episode" className="gap-8 px-6 pt-2">
      <View className="gap-5" style={contentColumn}>
        <View className="items-center">
          <View className="h-[200px] w-[200px] bg-skeleton" />
        </View>
        <View className="items-center gap-2">
          <SkeletonBar className="h-3 w-1/3" />
          <SkeletonBar className="h-7 w-11/12" />
          <SkeletonBar className="h-7 w-2/3" />
          <SkeletonBar className="h-3 w-1/2" />
        </View>
        <SkeletonBar className="h-12 w-full" />
        <View className="flex-row gap-2">
          {TILES.map((i) => (
            <SkeletonBar key={i} className="h-16 flex-1" />
          ))}
        </View>
      </View>
      <View className="gap-3" style={contentColumn}>
        <SkeletonBar className="h-6 w-32" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-4/5" />
      </View>
    </SkeletonGroup>
  );
}
