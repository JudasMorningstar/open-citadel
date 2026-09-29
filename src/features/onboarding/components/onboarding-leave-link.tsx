import React from 'react';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { LibraryBig } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { easing, motion } from '@/constants/theme';
import { cn } from '@/lib/cn';
import { asColor } from '@/utils/colors';

/**
 * The way out while the conversation is still going.
 *
 * Something is in their library, so they are never more than a tap from it,
 * whatever Samwell does next. Quieter than the `done` button because the
 * conversation is not over: he may still be offering podcasts and blogs, and
 * the field under this is how they answer him.
 *
 * Disabled while he is replying rather than removed. Removing it changed the
 * composer's height on every send and every reply, which moved the whole
 * transcript twice a turn and replayed the fade each time.
 */
export function OnboardingLeaveLink({ onPress, disabled }: { onPress: () => void; disabled: boolean }) {
  const [primary] = useCSSVariable(['--color-primary']);

  return (
    <Animated.View entering={FadeIn.duration(motion.base).easing(easing)} className="items-center pb-2">
      <Touchable
        className={cn('flex-row items-center gap-2 px-3 py-1', disabled && 'opacity-40')}
        haptic="select"
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <LibraryBig size={14} color={asColor(primary)} />
        <ThemedText type="labelSm" color={asColor(primary)}>
          GO TO MY LIBRARY
        </ThemedText>
      </Touchable>
    </Animated.View>
  );
}
