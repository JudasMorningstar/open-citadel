import React from 'react';
import { View, type ViewStyle } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { Card } from '@/components/ui/card';
import { AWAY_OPACITY, AWAY_SCALE } from '@/features/billing/components/plan-slide';

/** The dimmed look of a card the run is not resting on. See `PlanSlide`. */
const AWAY: ViewStyle = { opacity: AWAY_OPACITY, transform: [{ scale: AWAY_SCALE }] };

/** One plan card's outline: the rows `PlanCard` draws, at their sizes. */
function PlanCardBones() {
  return (
    <Card className="h-full gap-4 p-4">
      <View className="flex-row items-center gap-3">
        <SkeletonBar className="h-9 w-9 rounded-none" />
        <SkeletonBar className="h-4 w-28" />
      </View>
      <View className="flex-row items-end gap-2">
        <SkeletonBar className="h-8 w-20" />
        <SkeletonBar className="mb-1 h-3 w-12" />
      </View>
      <View className="gap-3">
        <SkeletonBar className="h-4 w-32" />
        <SkeletonBar className="h-3 w-40" />
        <SkeletonBar className="h-3 w-36" />
      </View>
    </Card>
  );
}

/**
 * The plan run before its answers are in: three card outlines where the three
 * cards will be, the middle one resting and its neighbours peeking, dimmed,
 * exactly as the run draws them, then the dots.
 *
 * The same geometry is the point. When the cards arrive they dissolve in over
 * this without a single edge moving, so the eye reads one surface filling in
 * rather than one thing being swapped for another. One pulse for the whole
 * run, for the reason `SkeletonGroup` gives.
 */
export function PlanCarouselSkeleton({
  cardWidth,
  height,
}: {
  cardWidth: number;
  /** The run's content height, which the carousel scales with font size. */
  height: number;
}) {
  const slide = React.useMemo<ViewStyle>(() => ({ width: cardWidth, height }), [cardWidth, height]);

  return (
    <SkeletonGroup label="Loading plans">
      {/* Wider than the screen and centred, so the neighbours overflow both
          edges the way the real run's do. */}
      <View className="flex-row justify-center overflow-hidden">
        {[0, 1, 2].map((index) => (
          <View key={index} className="px-2" style={slide}>
            <View className="h-full w-full" style={index === 1 ? undefined : AWAY}>
              <PlanCardBones />
            </View>
          </View>
        ))}
      </View>
      {/* The dots, as `Carousel.Dots` spaces them: 24 boxes, the middle one
          active. */}
      <View className="mt-4 flex-row items-center gap-1 self-center">
        {[0, 1, 2].map((dot) => (
          <View key={dot} className="h-6 w-6 items-center justify-center">
            <View className={dot === 1 ? 'h-1 w-4 bg-skeleton' : 'h-1 w-1 bg-skeleton'} />
          </View>
        ))}
      </View>
    </SkeletonGroup>
  );
}
