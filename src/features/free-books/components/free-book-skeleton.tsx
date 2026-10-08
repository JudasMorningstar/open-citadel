import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

/** A free book's page before it has landed: the hero at `FreeBookHero`'s sizes, then the summary. */
export function FreeBookSkeleton() {
  return (
    <SkeletonGroup label="Loading the book">
      <View className="gap-5 px-6 pb-6 pt-2">
        <View className="items-center">
          <View className="h-[225px] w-[150px] bg-skeleton" />
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
    </SkeletonGroup>
  );
}
