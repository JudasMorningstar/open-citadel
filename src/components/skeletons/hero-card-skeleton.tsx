import { View } from 'react-native';

import { HERO_CARD_MIN_HEIGHT } from '@/components/hero-card';
import { SkeletonBar } from '@/components/skeletons/skeleton-group';

const MIN = { minHeight: HERO_CARD_MIN_HEIGHT };

/**
 * `HeroCard` before its book or episode has loaded: the same height, the
 * media flush to the edge at the same proportion, and bars where the text
 * goes. Inside a `SkeletonGroup`, which owns the pulse.
 */
export function HeroCardSkeleton({ mediaAspect }: { mediaAspect: number }) {
  const media = { aspectRatio: mediaAspect, alignSelf: 'stretch' as const };
  return (
    <View className="mx-6 flex-row overflow-hidden border border-border bg-card" style={MIN}>
      <View className="bg-skeleton" style={media} />
      <View className="flex-1 justify-between p-4">
        <View className="gap-2">
          <SkeletonBar className="h-3 w-1/3" />
          <SkeletonBar className="h-5 w-full" />
          <SkeletonBar className="h-5 w-2/3" />
        </View>
        <View className="gap-3">
          <SkeletonBar className="h-1.5 w-full" />
          <SkeletonBar className="h-3 w-1/2" />
        </View>
      </View>
    </View>
  );
}
