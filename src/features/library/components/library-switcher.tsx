import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
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

/** The sides, left to right as the switch draws them. */
const ORDER: LibraryTab[] = ['books', 'podcasts', 'blogs'];

type LibrarySwitcherProps = {
  tab: LibraryTab;
  /** A side is null until it is first opened; mounted from then on and kept. */
  sides: Record<LibraryTab, React.ReactNode | null>;
};

type SideProps = {
  active: boolean;
  /** Shown from its first frame: the side the Library opened on. Any other fades in when first opened. */
  startShown: boolean;
  /** Which way the last switch went: 1 to the right, -1 to the left. */
  direction: number;
  children: React.ReactNode;
};

/**
 * One side: fully shown or gone, easing between the two. Coming in, it steps
 * in from the direction of the switch; going out, it steps away the other
 * way. Each side eases on its own, so passing from the first side to the
 * third never shows the second on the way through.
 */
function Side({ active, startShown, direction, children }: SideProps) {
  const reduceMotion = useReducedMotion();
  const shown = useSharedValue(startShown ? 1 : 0);
  React.useEffect(() => {
    shown.set(withTiming(active ? 1 : 0, { duration: motion.slow, easing }));
  }, [active, shown]);

  const offset = (reduceMotion ? 0 : SHIFT) * (active ? direction : -direction);
  const style = useAnimatedStyle(() => ({
    opacity: shown.get(),
    transform: [{ translateX: (1 - shown.get()) * offset }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents={active ? 'auto' : 'none'}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </Animated.View>
  );
}

/**
 * The Library's sides, one over another, trading places.
 *
 * Every side stays mounted once it has been shown, so switching back lands on
 * the same scroll position and never re-reads a shelf. `slow` (250ms) because
 * this is a cross-fade of content, which the house motion scale gives its
 * slowest step to. Opacity and translation only, on the UI thread.
 *
 * A side at rest out of view stays mounted at zero opacity with touches and
 * the screen reader turned away from it. Not `display: none`: that detaches
 * its native views, and a scroll offset is exactly the kind of state that can
 * come back reset.
 *
 * Under Reduce Motion there is no travel: the sides cross-fade in place.
 */
export function LibrarySwitcher({ tab, sides }: LibrarySwitcherProps) {
  // Which way the switch last moved, kept with the tab it moved from. Set
  // while rendering (React's pattern for state that follows a prop), so the
  // sides get it in the same render as the new tab.
  const [last, setLast] = React.useState({ tab, direction: 1 });
  const [openedOn] = React.useState(tab);
  if (last.tab !== tab) {
    setLast({ tab, direction: ORDER.indexOf(tab) >= ORDER.indexOf(last.tab) ? 1 : -1 });
  }

  return (
    <Animated.View className="flex-1">
      {ORDER.map((key) =>
        sides[key] ? (
          <Side key={key} active={key === tab} startShown={key === openedOn} direction={last.direction}>
            {sides[key]}
          </Side>
        ) : null,
      )}
    </Animated.View>
  );
}
