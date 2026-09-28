import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, useReducedMotion, withTiming } from 'react-native-reanimated';

import { Library, MicSignal, type LucideIcon } from '@/components/icons';
import { Touchable } from '@/components/ui/touchable';
import { easing, elevation, iconSize, motion } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { LibraryTab } from '@/stores/podcast-prefs';

const TABS: { key: LibraryTab; label: string; icon: LucideIcon }[] = [
  { key: 'books', label: 'Library', icon: Library },
  { key: 'podcasts', label: 'Podcasts', icon: MicSignal },
];

/** Every cell the same square, so the lift moves by whole cells. */
const CELL = 40;
const PILL_SIZE = { width: CELL };
/** `base` (180ms): flipped a few times a session, so felt rather than watched. */
const TIMING = { duration: motion.base, easing };

type LibraryTabsProps = {
  value: LibraryTab;
  onChange: (tab: LibraryTab) => void;
};

/**
 * The Library header's switch between books and podcasts: two icons, the
 * chosen one lifted on a card and drawn in gold. Built from the same parts as
 * the chat / Compass switch on Samwell's page, so the app has one idea of a
 * mode switch. The names are for screen readers.
 *
 * The lift is one card that slides between the cells rather than each cell
 * swapping its own background: a surface that travels says the two are one
 * control with one selection.
 */
export function LibraryTabs({ value, onChange }: LibraryTabsProps) {
  const tokens = useThemeTokens();
  const reduceMotion = useReducedMotion();
  const index = TABS.findIndex((tab) => tab.key === value);
  const offset = useDerivedValue(() => (reduceMotion ? index * CELL : withTiming(index * CELL, TIMING)));
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  return (
    <Animated.View className="flex-row border border-border bg-muted" accessibilityRole="tablist">
      <Animated.View
        pointerEvents="none"
        className="absolute bottom-0 left-0 top-0 bg-card"
        style={[elevation.soft, PILL_SIZE, pillStyle]}
      />
      {TABS.map((tab) => {
        const selected = tab.key === value;
        const Icon = tab.icon;
        const color = selected ? tokens['--color-primary'] : tokens['--color-muted-foreground'];
        const select = () => onChange(tab.key);
        return (
          <Touchable
            key={tab.key}
            className="h-10 w-10 items-center justify-center"
            onPress={selected ? undefined : select}
            haptic="select"
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected }}
          >
            <Icon size={iconSize.default} color={color} strokeWidth={2} />
          </Touchable>
        );
      })}
    </Animated.View>
  );
}
