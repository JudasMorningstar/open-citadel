import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Progress } from '@/components/ui/progress';
import { useListeningProgress } from '@/features/podcasts/hooks/use-listening-progress';
import { listenedFraction } from '@/features/podcasts/utils/format';
import type { EpisodeItem } from '@/services/podcasts/records';

const ORIGIN = { transformOrigin: 'left' } as const;

/**
 * The Continue Listening card's bar. The episode in the player draws the
 * player's own clock, so a scrub, a skip or the minutes played show on the
 * card as they happen rather than at the next pause; the rest draw where they
 * were left. The live bar is the same track as `Progress size="sm"`, so the
 * swap when an episode starts or stops is invisible.
 */
export function ContinueProgress({ episode, live }: { episode: EpisodeItem; live: boolean }) {
  if (!live) return <Progress value={listenedFraction(episode)} minValue={0} maxValue={1} size="sm" />;
  return <LiveBar positionSec={episode.positionSec} durationSec={episode.durationSec} />;
}

function LiveBar({ positionSec, durationSec }: { positionSec: number; durationSec: number }) {
  const progress = useListeningProgress(positionSec, durationSec);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.get() }] }));
  return (
    <View className="h-1.5 w-full overflow-hidden bg-primary/16">
      <Animated.View className="h-full w-full bg-primary" style={[ORIGIN, fillStyle]} />
    </View>
  );
}
