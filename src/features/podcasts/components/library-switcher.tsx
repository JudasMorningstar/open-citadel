import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { easing, motion } from '@/constants/theme';
import type { LibraryTab } from '@/stores/podcast-prefs';

/**
 * How far a side travels as it changes places. Enough to say which way the
 * other side lies (the same way the switch's card just slid), not so far that
 * two full pages sweep across each other: this is a change of view, not a
 * trip somewhere.
 */
const SHIFT = 16;

type LibrarySwitcherProps = {
  tab: LibraryTab;
  books: React.ReactNode;
  /** Null until podcasts is first opened; mounted from then on and kept. */
  podcasts: React.ReactNode | null;
};

/**
 * The Library's two sides, one over the other, trading places.
 *
 * Both stay mounted once each has been shown, so switching back lands on the
 * same scroll position and never re-reads a shelf. The side coming in fades
 * up from a short step in the direction of the switch (podcasts sits to the
 * right of books); the side going out fades the other way. `slow` (250ms)
 * because this is a cross-fade of content, which the house motion scale gives
 * its slowest step to. Opacity and translation only, on the UI thread.
 *
 * The side at rest out of view stays mounted at zero opacity with touches and
 * the screen reader turned away from it. Not `display: none`: that detaches
 * its native views, and a scroll offset is exactly the kind of state that can
 * come back reset.
 *
 * Under Reduce Motion there is no travel: the sides cross-fade in place.
 */
export function LibrarySwitcher({ tab, books, podcasts }: LibrarySwitcherProps) {
  const reduceMotion = useReducedMotion();
  const target = tab === 'podcasts' ? 1 : 0;
  const progress = useSharedValue(target);

  React.useEffect(() => {
    progress.set(withTiming(target, { duration: motion.slow, easing }));
  }, [progress, target]);

  const shift = reduceMotion ? 0 : SHIFT;
  const booksStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.get(), [0, 1], [1, 0]),
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [0, -shift]) }],
  }));
  const podcastsStyle = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateX: interpolate(progress.get(), [0, 1], [shift, 0]) }],
  }));

  return (
    <View className="flex-1">
      <Animated.View
        style={[StyleSheet.absoluteFill, booksStyle]}
        pointerEvents={tab === 'books' ? 'auto' : 'none'}
        accessibilityElementsHidden={tab !== 'books'}
        importantForAccessibility={tab === 'books' ? 'auto' : 'no-hide-descendants'}
      >
        {books}
      </Animated.View>
      {podcasts ? (
        <Animated.View
          style={[StyleSheet.absoluteFill, podcastsStyle]}
          pointerEvents={tab === 'podcasts' ? 'auto' : 'none'}
          accessibilityElementsHidden={tab !== 'podcasts'}
          importantForAccessibility={tab === 'podcasts' ? 'auto' : 'no-hide-descendants'}
        >
          {podcasts}
        </Animated.View>
      ) : null}
    </View>
  );
}
