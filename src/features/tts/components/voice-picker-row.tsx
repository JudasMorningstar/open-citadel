import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { AudioLines, ChevronUp } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrefixIcon } from '@/components/ui/prefix-icon';
import { Touchable } from '@/components/ui/touchable';
import { asColor } from '@/utils/colors';

export interface VoicePickerRowProps {
  /** The voice in use, by name. */
  name: string;
  onPress: () => void;
  /** What a screen reader says the row does, e.g. "Choose a Lite voice". */
  accessibilityLabel: string;
}

/**
 * The row that names the voice in use and opens the list of the others. Lite
 * and Enhanced voices are both chosen this way, so the two kinds differ in
 * what they sound like and not in how they are picked.
 */
export function VoicePickerRow({ name, onPress, accessibilityLabel }: VoicePickerRowProps) {
  const mutedForeground = useCSSVariable('--color-muted-foreground');
  return (
    <Touchable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
      <Card className="flex-row items-center justify-between p-3">
        <View className="flex-row items-center gap-3">
          <PrefixIcon icon={AudioLines} size={28} />
          <ThemedText type="bodyMd">Voice</ThemedText>
        </View>
        <View className="flex-row items-center gap-1">
          <ThemedText type="bodySm" color={asColor(mutedForeground)}>
            {name}
          </ThemedText>
          <ChevronUp size={14} color={asColor(mutedForeground)} />
        </View>
      </Card>
    </Touchable>
  );
}
