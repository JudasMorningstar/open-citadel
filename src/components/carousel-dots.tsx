import React from 'react';
import { Pressable, View, type AccessibilityActionEvent, type GestureResponderEvent } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useCarouselState } from '@/components/ui/carousel';
import { cn } from '@/lib/cn';

const DOT = 6;
/** One dot and the gap after it: how far the bar travels per slide. */
const PITCH = 12;
const BAR = 14;
const ROW_HEIGHT = 24;

const DOT_SLOT = { width: PITCH, height: ROW_HEIGHT };
const DOT_BOX = { width: DOT, height: DOT };
const BAR_BOX = {
  position: 'absolute',
  left: (PITCH - BAR) / 2,
  top: (ROW_HEIGHT - DOT) / 2,
  width: BAR,
  height: DOT,
} as const;
const STEPS = [{ name: 'increment' }, { name: 'decrement' }] as const;

export interface CarouselDotsProps {
  className?: string;
  /** What the run is a run of, for a screen reader: "Voice", "Plan". */
  label: string;
}

/**
 * A carousel's page indicator, the one every run in the app wears: a row of square dots with one gold bar that
 * slides along it under the finger.
 *
 * One animated node, moved by a transform. It used to be every dot growing
 * and shrinking its own `width`, which is a layout prop: each frame of a swipe
 * laid the row out again, once per dot, and on a Galaxy A33 that was most of
 * why the run stuttered.
 *
 * One pressable too, which works out the dot from where it was touched. A
 * pressable per dot was nine or ten of them for a row nobody presses often,
 * and each is a noticeable part of what the run costs to build. To a screen
 * reader the row is one adjustable control, stepped a slide at a time.
 *
 * Goes inside a `Carousel`, which it reads its place from.
 */
export function CarouselDots({ className, label }: CarouselDotsProps) {
  const { count, progress, index: active, scrollTo } = useCarouselState();
  const dots = React.useMemo(() => Array.from({ length: count }, (_unused, index) => index), [count]);

  const bar = useAnimatedStyle(() => ({
    // Held inside the row: past either end the run rubber-bands, the bar does not.
    transform: [{ translateX: Math.min(count - 1, Math.max(0, progress.value)) * PITCH }],
  }));

  if (count <= 1) return null;

  const goToTouched = (event: GestureResponderEvent) =>
    scrollTo(Math.min(count - 1, Math.max(0, Math.floor(event.nativeEvent.locationX / PITCH))));
  const step = (event: AccessibilityActionEvent) =>
    scrollTo(active + (event.nativeEvent.actionName === 'increment' ? 1 : -1));

  return (
    <Pressable
      className={cn('flex-row items-center', className)}
      onPress={goToTouched}
      hitSlop={8}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: count, now: active + 1 }}
      accessibilityActions={STEPS}
      onAccessibilityAction={step}
    >
      {dots.map((index) => (
        <View key={index} style={DOT_SLOT} className="items-center justify-center">
          <View className="bg-border" style={DOT_BOX} />
        </View>
      ))}
      <Animated.View pointerEvents="none" className="bg-primary" style={[BAR_BOX, bar]} />
    </Pressable>
  );
}
