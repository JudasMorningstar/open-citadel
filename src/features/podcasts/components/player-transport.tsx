import React from 'react';
import { View } from 'react-native';

import { Pause, Play } from '@/components/icons';
import { Spinner } from '@/components/ui/spinner';
import { Touchable } from '@/components/ui/touchable';
import { elevation } from '@/constants/theme';
import { SkipGlyph } from '@/features/podcasts/components/skip-glyph';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PlayerTransportProps = {
  playing: boolean;
  buffering: boolean;
  skipBackSec: number;
  skipForwardSec: number;
  onToggle: () => void;
  onBack: () => void;
  onForward: () => void;
};

/**
 * Back, play, forward. Play is the gold square in the middle and the biggest
 * target on the screen, because it is the one pressed without looking; the
 * skips sit either side at thumb's reach.
 */
export function PlayerTransport({ playing, buffering, skipBackSec, skipForwardSec, onToggle, onBack, onForward }: PlayerTransportProps) {
  const tokens = useThemeTokens();
  const ink = tokens['--color-foreground'];
  const onGold = tokens['--color-background'];
  const Icon = playing ? Pause : Play;

  return (
    <View className="flex-row items-center justify-center gap-10">
      <Touchable
        className="h-16 w-16 items-center justify-center"
        onPress={onBack}
        haptic="tap"
        accessibilityRole="button"
        accessibilityLabel={`Back ${skipBackSec} seconds`}
      >
        <SkipGlyph direction="back" seconds={skipBackSec} size={36} color={ink} />
      </Touchable>
      <Touchable
        className="h-20 w-20 items-center justify-center bg-primary"
        style={elevation.card}
        onPress={onToggle}
        haptic="tap"
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause' : 'Play'}
      >
        {buffering && playing ? <Spinner /> : <Icon size={34} color={onGold} fill={onGold} />}
      </Touchable>
      <Touchable
        className="h-16 w-16 items-center justify-center"
        onPress={onForward}
        haptic="tap"
        accessibilityRole="button"
        accessibilityLabel={`Forward ${skipForwardSec} seconds`}
      >
        <SkipGlyph direction="forward" seconds={skipForwardSec} size={36} color={ink} />
      </Touchable>
    </View>
  );
}
