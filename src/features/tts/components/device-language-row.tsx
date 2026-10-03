import React from 'react';
import { View } from 'react-native';

import { ChevronDown, ChevronUp } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { countLabel } from '@/utils/format';

export interface DeviceLanguageRowProps {
  /** The language's code as the list shows it, for example "EN". */
  language: string;
  /** How many voices the phone has in it. */
  count: number;
  open: boolean;
  mutedForeground?: string;
  onToggle: (language: string) => void;
}

/**
 * One language in the phone voice list. A tap shows or hides its voices, so
 * the list opens on the few languages worth reading in and the rest wait one
 * tap deeper instead of all being drawn at once.
 */
export const DeviceLanguageRow = React.memo(function DeviceLanguageRow({
  language,
  count,
  open,
  mutedForeground,
  onToggle,
}: DeviceLanguageRowProps) {
  const Chevron = open ? ChevronUp : ChevronDown;
  const hint = open ? 'Hides its voices' : 'Shows its voices';
  const voiceCount = countLabel(count, 'VOICE');
  const label = `${language}, ${countLabel(count, 'voice', 'voices')}`;

  return (
    <Touchable
      className="flex-row items-center justify-between bg-popover px-6 py-3"
      onPress={() => onToggle(language)}
      haptic="tap"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ expanded: open }}
    >
      <ThemedText type="labelSm" color={mutedForeground}>
        {language}
      </ThemedText>
      <View className="flex-row items-center gap-2">
        <ThemedText type="labelSm" color={mutedForeground}>
          {voiceCount}
        </ThemedText>
        <Chevron size={14} color={mutedForeground} />
      </View>
    </Touchable>
  );
});
