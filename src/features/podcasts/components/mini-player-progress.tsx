import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useListeningProgress } from '@/features/podcasts/hooks/use-listening-progress';

const ORIGIN = { transformOrigin: 'left' } as const;

/**
 * The gold hairline along the mini player's top edge: how far through the
 * episode the listener is, scaled on the UI thread. Its own component because
 * it owns the clock (see `useListeningProgress`).
 */
export function MiniPlayerProgress({ positionSec, durationSec }: { positionSec: number; durationSec: number }) {
  const progress = useListeningProgress(positionSec, durationSec);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));
  return (
    <View className="absolute left-0 right-0 top-0 h-[2px]">
      <Animated.View className="h-full w-full bg-primary" style={[ORIGIN, fillStyle]} />
    </View>
  );
}
