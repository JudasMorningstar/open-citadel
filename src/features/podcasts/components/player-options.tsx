import React from 'react';
import { View } from 'react-native';

import { List, ListMusic, Moon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PlayerOptionsProps = {
  speedLabel: string;
  /** Null when no sleep timer is set. */
  sleepLabel: string | null;
  upNextCount: number;
  hasChapters: boolean;
  onSpeed: () => void;
  onSleep: () => void;
  onUpNext: () => void;
  onChapters: () => void;
};

type Option = { key: string; label: string; active: boolean; onPress: () => void; icon?: typeof Moon };

/**
 * The player's second row: speed, sleep timer, Up Next and chapters. Each
 * carries its current value as its label ("1.5×", "12:04", "3"), so the row
 * reads as the state of the player as well as a set of controls, and a set
 * one is gold.
 */
export function PlayerOptions({ speedLabel, sleepLabel, upNextCount, hasChapters, onSpeed, onSleep, onUpNext, onChapters }: PlayerOptionsProps) {
  const tokens = useThemeTokens();
  const options: Option[] = [
    { key: 'speed', label: speedLabel, active: speedLabel !== '1×', onPress: onSpeed },
    { key: 'sleep', label: sleepLabel ?? 'Sleep', active: sleepLabel !== null, onPress: onSleep, icon: Moon },
    { key: 'upnext', label: upNextCount > 0 ? `Up Next ${upNextCount}` : 'Up Next', active: false, onPress: onUpNext, icon: ListMusic },
    ...(hasChapters ? [{ key: 'chapters', label: 'Chapters', active: false, onPress: onChapters, icon: List }] : []),
  ];

  return (
    <View className="flex-row justify-center gap-2">
      {options.map((option) => {
        const color = option.active ? tokens['--color-primary'] : tokens['--color-foreground'];
        return (
          <Touchable
            key={option.key}
            className="min-h-10 flex-row items-center gap-1.5 border border-border bg-card px-3 shadow-sm"
            onPress={option.onPress}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            {option.icon ? <option.icon size={14} color={color} /> : null}
            <ThemedText type="labelSm" color={color} style={{ fontVariant: ['tabular-nums'] }}>
              {option.label}
            </ThemedText>
          </Touchable>
        );
      })}
    </View>
  );
}
