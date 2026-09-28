import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

const OPTIONS = [0, 1, 2, 3];

/**
 * The player's controls while its drawer rises: the scrubber, the transport
 * and the options at their real sizes, so the controls land in place when
 * they mount.
 */
export function PlayerControlsSkeleton() {
  return (
    <SkeletonGroup className="gap-8">
      <View className="gap-2">
        <View className="h-8 justify-center">
          <SkeletonBar className="h-1 w-full" />
        </View>
        <View className="flex-row justify-between">
          <SkeletonBar className="h-3 w-12" />
          <SkeletonBar className="h-3 w-12" />
        </View>
      </View>
      <View className="flex-row items-center justify-center gap-10">
        <SkeletonBar className="h-12 w-12" />
        <SkeletonBar className="h-20 w-20" />
        <SkeletonBar className="h-12 w-12" />
      </View>
      <View className="flex-row justify-center gap-2">
        {OPTIONS.map((i) => (
          <SkeletonBar key={i} className="h-10 w-16" />
        ))}
      </View>
    </SkeletonGroup>
  );
}
