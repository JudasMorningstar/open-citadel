import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { ChoiceChips } from '@/features/podcasts/components/choice-chips';
import { SPEEDS } from '@/features/podcasts/utils/setting-choices';
import { formatSpeed } from '@/features/podcasts/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

const CHOICES = SPEEDS.map((s) => ({ value: s, label: formatSpeed(s) }));

type SpeedSheetProps = {
  visible: boolean;
  speed: number;
  /** The show's name when it has a speed of its own, which this then changes. */
  showOverride: string | null;
  onClose: () => void;
  onChange: (speed: number) => void;
};

/** Playback speed, and a plain line saying what the change applies to. */
export function SpeedSheet({ visible, speed, showOverride, onClose, onChange }: SpeedSheetProps) {
  const tokens = useThemeTokens();
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-4 pb-2">
        <View className="gap-1 px-4">
          <ThemedText type="headlineSm">Playback speed</ThemedText>
          <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
            {showOverride ? `Applies to ${showOverride}, which has a speed of its own.` : 'Applies to every show without a speed of its own.'}
          </ThemedText>
        </View>
        <ChoiceChips choices={CHOICES} value={speed} onChange={onChange} />
      </View>
    </Sheet>
  );
}
