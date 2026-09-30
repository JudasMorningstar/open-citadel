import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { haptics } from '@/utils/haptics';

/** Past this far down, or this fast, letting go dismisses. */
const DISMISS_DISTANCE = 44;
const DISMISS_VELOCITY = 600;
/** Thrown away: the finger's speed carried into a settle that never passes the edge. */
const THROW = { duration: 240, dampingRatio: 1, overshootClamping: true } as const;
/** Let go short of the line: back home with a little give, from the finger's speed. */
const RETURN = { duration: 400, dampingRatio: 0.8 } as const;

/**
 * Swiping a floating card down and away.
 *
 * Down only: sideways belongs to the hub's pager the card floats over, and up
 * is where the full player comes from. The card follows the finger 1:1 and,
 * let go, carries on at the finger's speed: past the bottom edge if it was
 * thrown or pulled far enough, back home otherwise. No fade: it is the same
 * solid card that slides in from that edge (`slideUpFromEdge`), leaving the
 * way it came. `offscreen` is how far it has to travel to be gone.
 */
export function useDismissSwipe(onDismiss: () => void, offscreen: number) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);

  const gesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-14, 14])
    .onUpdate((e) => y.set(Math.max(0, e.translationY)))
    .onEnd((e) => {
      const velocity = e.velocityY;
      if (e.translationY > DISMISS_DISTANCE || velocity > DISMISS_VELOCITY) {
        scheduleOnRN(haptics.select);
        const done = (finished?: boolean) => {
          'worklet';
          if (finished) scheduleOnRN(onDismiss);
        };
        if (reduceMotion) y.set(withTiming(offscreen, { duration: 0 }, done));
        else y.set(withSpring(offscreen, { ...THROW, velocity: Math.max(0, velocity) }, done));
      } else {
        y.set(reduceMotion ? 0 : withSpring(0, { ...RETURN, velocity }));
      }
    })
    .onFinalize((_e, success) => {
      if (!success) y.set(reduceMotion ? 0 : withSpring(0, RETURN));
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));

  return { gesture, style };
}
