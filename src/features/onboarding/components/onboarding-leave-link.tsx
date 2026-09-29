import React from 'react';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { LibraryBig } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { easing, motion } from '@/constants/theme';
import { asColor } from '@/utils/colors';

/**
 * The way out while the conversation is still going.
 *
 * Something is in their library, so they are never more than a tap from it,
 * whatever Samwell does next. Quieter than the `done` button because the
 * conversation is not over: he may still be offering podcasts and blogs, and
 * the field under this is how they answer him.
 *
 * Gone while he is replying, not dimmed. Dimmed, it still read as a button in
 * the middle of his work, and leaving then cut him off mid-sentence. Faded
 * rather than removed, so the composer keeps its height and the transcript
 * does not move twice a turn.
 */
export function OnboardingLeaveLink({ onPress, hidden }: { onPress: () => void; hidden: boolean }) {
  const [primary] = useCSSVariable(['--color-primary']);
  const fade = useAnimatedStyle(() => ({
    opacity: withTiming(hidden ? 0 : 1, { duration: motion.fast, easing }),
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(motion.base).easing(easing)}
      style={fade}
      className="items-center pb-2"
      pointerEvents={hidden ? 'none' : 'auto'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
    >
      <Touchable
        className="flex-row items-center gap-2 px-3 py-1"
        haptic="select"
        onPress={onPress}
        accessibilityRole="button"
      >
        <LibraryBig size={14} color={asColor(primary)} />
        <ThemedText type="labelSm" color={asColor(primary)}>
          GO TO MY LIBRARY
        </ThemedText>
      </Touchable>
    </Animated.View>
  );
}
