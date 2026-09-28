import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

const ART = 128;

/** A blog's page before it has landed: its picture, name, one line and button at `BlogHero`'s sizes. */
export function BlogPageSkeleton() {
  return (
    <SkeletonGroup label="Loading the blog" className="gap-5 px-6 pt-2">
      <View className="items-center">
        <View className="bg-skeleton" style={{ width: ART, height: ART }} />
      </View>
      <View className="items-center gap-2">
        <SkeletonBar className="h-7 w-3/5" />
        <SkeletonBar className="h-3 w-1/4" />
      </View>
      <View className="items-center gap-2">
        <SkeletonBar className="h-3.5 w-11/12" />
        <SkeletonBar className="h-3.5 w-3/4" />
      </View>
      <SkeletonBar className="h-10 w-full" />
    </SkeletonGroup>
  );
}
