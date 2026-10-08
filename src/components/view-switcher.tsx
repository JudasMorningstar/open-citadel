import React from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Animated, {
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useCSSVariable } from "uniwind";

import { easing, motion } from "@/constants/theme";
import {
    PARALLAX,
    SIDE_CLOSE,
    SIDE_DIM,
    SIDE_OPEN,
} from "@/navigation/transitions";
import { asColor } from "@/utils/colors";

/**
 * How far a side travels as it changes places. Enough to say which way the
 * other side lies (the same way the switch's card just slid), not so far that
 * two full pages sweep across each other: this is a change of view, not a
 * trip somewhere.
 */
const SHIFT = 16;

type ViewSwitcherProps<K extends string> = {
  /** The sides, left to right as their switch draws them. */
  order: readonly K[];
  value: K;
  /** A side is null until it is first opened; mounted from then on and kept. */
  sides: Record<K, React.ReactNode | null>;
  /** Push-style motion for hierarchical pages instead of the short peer-view crossfade. */
  page?: boolean;
};

type SideProps = {
  active: boolean;
  /** Shown from its first frame: the side the Library opened on. Any other fades in when first opened. */
  startShown: boolean;
  /** Which way the last switch went: 1 to the right, -1 to the left. */
  direction: number;
  page: boolean;
  children: React.ReactNode;
};

/**
 * One side: fully shown or gone, easing between the two. Coming in, it steps
 * in from the direction of the switch; going out, it steps away the other
 * way. Each side eases on its own, so passing from the first side to the
 * third never shows the second on the way through.
 */
function Side({ active, startShown, direction, page, children }: SideProps) {
  const reduceMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const scrim = asColor(useCSSVariable("--color-scrim"));
  const shown = useSharedValue(startShown ? 1 : 0);
  // The deeper page slides over; the shallower one parallaxes and dims beneath it.
  const top = active === (direction === 1);
  const slides = page && !reduceMotion;
  React.useEffect(() => {
    const spec = page
      ? direction === 1
        ? SIDE_OPEN
        : SIDE_CLOSE
      : { duration: motion.slow, easing };
    shown.set(withTiming(active ? 1 : 0, spec));
  }, [active, direction, page, shown]);

  const offset = reduceMotion
    ? 0
    : page
      ? top
        ? width
        : -width * PARALLAX
      : SHIFT * (active ? direction : -direction);
  const style = useAnimatedStyle(() => ({
    opacity: slides ? (shown.get() > 0 ? 1 : 0) : shown.get(),
    transform: [{ translateX: (1 - shown.get()) * offset }],
  }));
  const dimStyle = useAnimatedStyle(() => ({
    opacity: top ? 0 : SIDE_DIM * (1 - shown.get()),
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents={active ? "auto" : "none"}
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
    >
      {children}
      {slides ? (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: scrim },
            dimStyle,
          ]}
        />
      ) : null}
    </Animated.View>
  );
}

/**
 * The sides of a screen with a switch in it, one over another, trading
 * places: the Library's books, podcasts and blogs, Samwell's chat and Compass.
 *
 * Every side stays mounted once it has been shown, so switching back lands on
 * the same scroll position and never re-reads a shelf or a conversation. `slow` (250ms) because
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
export function ViewSwitcher<K extends string>({
  order,
  value,
  sides,
  page = false,
}: ViewSwitcherProps<K>) {
  // Which way the switch last moved, kept with the side it moved from. Set
  // while rendering (React's pattern for state that follows a prop), so the
  // sides get it in the same render as the new value.
  const [last, setLast] = React.useState({ value, direction: 1 });
  const [openedOn] = React.useState(value);
  if (last.value !== value) {
    setLast({
      value,
      direction: order.indexOf(value) >= order.indexOf(last.value) ? 1 : -1,
    });
  }

  return (
    <Animated.View
      className="flex-1"
      style={page ? { overflow: "hidden" } : undefined}
    >
      {order.map((key) =>
        sides[key] ? (
          <Side
            key={key}
            active={key === value}
            startShown={key === openedOn}
            direction={last.direction}
            page={page}
          >
            {sides[key]}
          </Side>
        ) : null,
      )}
    </Animated.View>
  );
}
