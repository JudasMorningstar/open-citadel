import React from 'react';
import { View } from 'react-native';

import { Volume2 } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import type { DeviceVoice } from '@/utils/device-voices';

export interface DeviceVoiceItemProps {
  voice: DeviceVoice;
  isSelected: boolean;
  isPreviewing: boolean;
  primary?: string;
  mutedForeground?: string;
  onSelect: (voice: DeviceVoice) => void;
  onPreview: (voice: DeviceVoice) => void;
}

/**
 * One phone voice in the picker's list, memoized on primitives: a selection or
 * preview flip re-renders the affected rows, not every voice in the list.
 */
export const DeviceVoiceItem = React.memo(function DeviceVoiceItem({
  voice,
  isSelected,
  isPreviewing,
  primary,
  mutedForeground,
  onSelect,
  onPreview,
}: DeviceVoiceItemProps) {
  return (
    <Touchable
      className="flex-row items-center gap-4 border-b border-card px-6 py-4"
      onPress={() => onSelect(voice)}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <View className="flex-1 gap-1">
        <ThemedText type="bodyMd">{voice.name}</ThemedText>
        {voice.language ? (
          <ThemedText type="labelSm" color={mutedForeground}>
            {voice.language}
          </ThemedText>
        ) : null}
      </View>
      {voice.quality ? (
        <View className="bg-muted px-2 py-[2px]">
          <ThemedText type="labelSm" color={mutedForeground}>
            {voice.quality}
          </ThemedText>
        </View>
      ) : null}
      {voice.identifier ? (
        <Touchable
          onPress={(event) => {
            event.stopPropagation();
            onPreview(voice);
          }}
          hitSlop={8}
          accessibilityLabel={`Preview ${voice.name}`}
        >
          <Volume2 size={18} color={isPreviewing ? primary : mutedForeground} />
        </Touchable>
      ) : null}
      {isSelected && (
        <ThemedText type="bodyMd" color={primary}>
          ✓
        </ThemedText>
      )}
    </Touchable>
  );
});
