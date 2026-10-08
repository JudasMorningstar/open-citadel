import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { EpisodeRowsSkeleton } from '@/features/podcasts/components/episode-rows-skeleton';

/** A show's page before it has landed: the hero at `ShowHero`'s sizes, then its first episodes. */
export function ShowPageSkeleton() {
  return (
    <SkeletonGroup label="Loading the show">
      <View className="gap-5 px-6 pb-6 pt-2">
        <View className="items-center">
          <View className="h-[180px] w-[180px] bg-skeleton" />
        </View>
        <View className="items-center gap-2">
          <SkeletonBar className="h-7 w-3/4" />
          <SkeletonBar className="h-4 w-1/3" />
        </View>
        <SkeletonBar className="h-11 w-full" />
        <View className="gap-2">
          <SkeletonBar className="h-4 w-full" />
          <SkeletonBar className="h-4 w-full" />
          <SkeletonBar className="h-4 w-2/3" />
        </View>
      </View>
      <EpisodeRowsSkeleton count={3} />
    </SkeletonGroup>
  );
}
