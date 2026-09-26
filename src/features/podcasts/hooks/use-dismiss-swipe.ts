import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { easing, motion } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

/** Past this far down, or this fast, letting go dismisses. */
const DISMISS_DISTANCE = 44;
const DISMISS_VELOCITY = 600;

/**
 * Swiping a floating card down and away.
 *
 * Down only: sideways belongs to the hub's pager the card floats over, and up
 * is where the full player comes from. The card follows the finger 1:1 and
 * fades as it goes, so the gesture reads as putting it away before it has
 * finished. Letting go short of the line springs it back. `offscreen` is how
 * far it has to travel to be gone.
 */
export function useDismissSwipe(onDismiss: () => void, offscreen: number) {
  const reduceMotion = useReducedMotion();
  const y = useSharedValue(0);
  const timing = { duration: reduceMotion ? 0 : motion.base, easing };

  const gesture = Gesture.Pan()
    .activeOffsetY(10)
    .failOffsetX([-14, 14])
    .onUpdate((e) => y.set(Math.max(0, e.translationY)))
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        scheduleOnRN(haptics.select);
        y.set(
          withTiming(offscreen, timing, (finished) => {
            if (finished) scheduleOnRN(onDismiss);
          }),
        );
      } else {
        y.set(withTiming(0, timing));
      }
    })
    .onFinalize((_e, success) => {
      if (!success) y.set(withTiming(0, timing));
    });

  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(1, y.get() / offscreen),
    transform: [{ translateY: y.get() }],
  }));

  return { gesture, style };
}
