import React from 'react';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Transition from 'react-native-screen-transitions';

import { easing, elevation, motion } from '@/constants/theme';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { NOW_PLAYING_ART } from '@/navigation/transitions';

/** How far the artwork steps back while paused. */
const PAUSED_SCALE = 0.86;

type PlayerArtworkProps = {
  uri: string | null;
  size: number;
  playing: boolean;
};

/**
 * The artwork, large, and the player's state made physical: full size while
 * the episode plays, a step back while it is paused. It is the largest thing
 * on the screen, so it answers "is this playing" before any icon does.
 *
 * Scale only, on the UI thread, on the house curve at `slow`: a state change
 * the listener caused, not a flourish. Under Reduce Motion it holds still.
 *
 * It is also what the player grows out of: tagged the same as the mini
 * player's artwork (`NOW_PLAYING_ART`), measured at full size around the
 * paused step-back, and drawn with no fade, since it has to be there the
 * moment the small one starts growing into it.
 */
export function PlayerArtwork({ uri, size, playing }: PlayerArtworkProps) {
  const tokens = useThemeTokens();
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(playing || reduceMotion ? 1 : PAUSED_SCALE);

  React.useEffect(() => {
    if (reduceMotion) return;
    scale.set(withTiming(playing ? 1 : PAUSED_SCALE, { duration: motion.slow, easing }));
  }, [playing, reduceMotion, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <Transition.Boundary id={NOW_PLAYING_ART}>
      <Animated.View style={[elevation.card, style]}>
        <PodcastArtwork uri={uri} size={size} placeholderColor={tokens['--color-surface-tertiary']} />
      </Animated.View>
    </Transition.Boundary>
  );
}
