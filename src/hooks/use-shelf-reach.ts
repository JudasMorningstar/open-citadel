import React from 'react';
import { useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { useAnimatedReaction, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useScrollMotion } from '@/hooks/use-scroll-motion';

/** How far past the screen counts as within reach: this many screens' worth of shelves. */
const REACH_SCREENS = 1.5;

/**
 * What a column of shelves needs to know about its scroll: how many shelves
 * it has come within reach of, counted from the top, and whether it is moving.
 *
 * The shelves of a page are one height, so the first one's is measured and
 * the rest is arithmetic on the UI thread. The count crosses to React when it
 * changes, which is once per shelf scrolled, and it only grows. Moving is
 * `useScrollMotion`'s.
 */
export function useShelfReach(first: number) {
  const { height: windowHeight } = useWindowDimensions();
  const [reach, setReach] = React.useState(first);
  const [moving, setMoving] = React.useState(false);
  const shelfHeight = useSharedValue(0);
  const offset = useSharedValue(0);
  const viewport = useSharedValue(windowHeight);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      offset.set(event.contentOffset.y);
      viewport.set(event.layoutMeasurement.height);
    },
  });

  const grow = React.useCallback((next: number) => setReach((current) => Math.max(current, next)), []);

  useAnimatedReaction(
    () => {
      const height = shelfHeight.get();
      return height > 0 ? Math.ceil((offset.get() + viewport.get() * (1 + REACH_SCREENS)) / height) : first;
    },
    (next, previous) => {
      if (next !== previous && next > first) scheduleOnRN(grow, next);
    },
  );

  const onShelfLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      shelfHeight.set(event.nativeEvent.layout.height);
    },
    [shelfHeight],
  );

  const motion = useScrollMotion(setMoving);

  return { reach, moving, onScroll, onShelfLayout, motion };
}
