import React from 'react';
import { View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { PlayerScrubber } from '@/features/podcasts/components/player-scrubber';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PlayerProgressProps = {
  chapterTitle: string | null;
  position: SharedValue<number>;
  duration: SharedValue<number>;
  error: string | null;
  onChapters: () => void;
  onSeek: (seconds: number) => void;
  /** Takes touches. False while the player is still opening. */
  live: boolean;
};

/** Where the listener is: the chapter playing (which opens the list), the scrubber, and why playback stopped, if it did. */
export function PlayerProgress({ chapterTitle, position, duration, error, onChapters, onSeek, live }: PlayerProgressProps) {
  const tokens = useThemeTokens();
  return (
    <View className="gap-1">
      {chapterTitle ? (
        <Touchable onPress={onChapters} accessibilityRole="button" accessibilityLabel="Chapters">
          <ThemedText type="labelSm" color={tokens['--color-primary']} numberOfLines={1}>
            {chapterTitle}
          </ThemedText>
        </Touchable>
      ) : null}
      <PlayerScrubber position={position} duration={duration} onSeek={onSeek} live={live} />
      {error ? (
        <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}
