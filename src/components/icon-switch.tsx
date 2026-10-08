import React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, useReducedMotion, withTiming } from 'react-native-reanimated';

import type { LucideIcon } from '@/components/icons';
import { Touchable } from '@/components/ui/touchable';
import { easing, elevation, iconSize, motion } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { cn } from '@/lib/cn';

export type IconSwitchItem<K extends string> = { key: K; label: string; icon: LucideIcon };

/** Every cell the same square, so the lift moves by whole cells. */
const CELL = 40;
const PILL_SIZE = { width: CELL };
/** `base` (180ms): flipped a few times a session, so felt rather than watched. */
const TIMING = { duration: motion.base, easing };

type IconSwitchProps<K extends string> = {
  items: readonly IconSwitchItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Held on the current choice: the others are dimmed and take no press. */
  locked?: boolean;
};

/**
 * The app's one mode switch: an icon each, the chosen one lifted on a card
 * and drawn in gold. The Library header's books / podcasts / blogs and the
 * chat / Compass switch on Samwell's card are both this, so the app has one
 * idea of a mode switch. The names are for screen readers.
 *
 * The lift is one card that slides between the cells rather than each cell
 * swapping its own background: a surface that travels says the cells are one
 * control with one selection. What the switch shows below it trades places
 * with the same timing (`ViewSwitcher`).
 */
export function IconSwitch<K extends string>({ items, value, onChange, locked = false }: IconSwitchProps<K>) {
  const tokens = useThemeTokens();
  const reduceMotion = useReducedMotion();
  const index = items.findIndex((item) => item.key === value);
  const offset = useDerivedValue(() => (reduceMotion ? index * CELL : withTiming(index * CELL, TIMING)));
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));

  return (
    <Animated.View className="flex-row border border-border bg-muted" accessibilityRole="tablist">
      <Animated.View
        pointerEvents="none"
        className="absolute bottom-0 left-0 top-0 bg-card"
        style={[elevation.soft, PILL_SIZE, pillStyle]}
      />
      {items.map((item) => {
        const selected = item.key === value;
        const Icon = item.icon;
        const color = selected ? tokens['--color-primary'] : tokens['--color-muted-foreground'];
        const select = () => onChange(item.key);
        return (
          <Touchable
            key={item.key}
            className={cn('h-10 w-10 items-center justify-center', locked && !selected && 'opacity-35')}
            onPress={selected || locked ? undefined : select}
            haptic="select"
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected, disabled: locked && !selected }}
          >
            <Icon size={iconSize.default} color={color} strokeWidth={2} />
          </Touchable>
        );
      })}
    </Animated.View>
  );
}
