import { useEffect, useRef } from 'react';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { glideDuration } from '@/utils/progress-glide';

/**
 * A progress bar's fill, travelling between samples on the UI thread.
 *
 * Takes a fraction that arrives in steps (a download's byte count, sampled)
 * and returns the style for a full-width fill anchored at its leading edge:
 * `scaleX`, so nothing is laid out again as it moves. Each new sample is
 * reached over the time the last one took to arrive (`glideDuration`), at a
 * constant speed, which is what a bar that reports steady work should look
 * like. The bar never runs ahead of a figure that was really reported.
 *
 * React re-renders once per sample, to hand the new target over, and not at
 * all in between. Under Reduce Motion the fill steps to each sample instead.
 *
 * A figure that goes DOWN is a different job starting (a retry from nothing),
 * so the fill is placed there rather than seen sliding backwards.
 */
export function useProgressGlide(fraction: number) {
  const shown = useSharedValue(fraction);
  const target = useRef(fraction);
  const sampledAt = useRef<number | null>(null);

  useEffect(() => {
    if (fraction === target.current) return;
    const now = Date.now();
    if (fraction < target.current) {
      cancelAnimation(shown);
      shown.set(fraction);
      sampledAt.current = null;
    } else {
      shown.set(
        withTiming(fraction, {
          duration: glideDuration(sampledAt.current, now),
          easing: Easing.linear,
          reduceMotion: ReduceMotion.System,
        }),
      );
      sampledAt.current = now;
    }
    target.current = fraction;
  }, [fraction, shown]);

  useEffect(() => () => cancelAnimation(shown), [shown]);

  return useAnimatedStyle(() => ({ transform: [{ scaleX: shown.get() }] }));
}
