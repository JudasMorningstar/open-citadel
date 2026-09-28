import React from 'react';
import { View } from 'react-native';

import { SkeletonBar } from '@/components/skeletons/skeleton-group';

const TILE_PADDING = 16;

/**
 * A show or blog tile before it has arrived: the same panel, a square where the
 * artwork goes and bars for the name and author, so a shelf that is still
 * loading already takes the room it will need. Pulses only inside a
 * `SkeletonGroup`; on its own it holds still.
 */
export function FeedTileSkeleton({ width }: { width: number }) {
  const art = width - TILE_PADDING * 2;
  return (
    <View className="gap-3 bg-tile p-4" style={{ width }}>
      <View className="bg-skeleton" style={{ width: art, height: art }} />
      <View className="gap-1">
        <View className="h-12 justify-center gap-2">
          <SkeletonBar className="h-3.5 w-4/5" />
          <SkeletonBar className="h-3.5 w-1/2" />
        </View>
        <View className="h-5 justify-center">
          <SkeletonBar className="h-2.5 w-2/5" />
        </View>
      </View>
    </View>
  );
}
