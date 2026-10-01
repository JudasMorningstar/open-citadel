import React from 'react';
import { View } from 'react-native';

import { SkeletonBar } from '@/components/skeletons/skeleton-group';

/** A shelf's title and its VIEW ALL card, at `ShelfSection`'s sizes. Pulses only inside a `SkeletonGroup`. */
export function ShelfHeadingSkeleton() {
  return (
    <View className="flex-row items-center justify-between px-6">
      <SkeletonBar className="h-6 w-44" />
      <SkeletonBar className="h-7 w-20" />
    </View>
  );
}
