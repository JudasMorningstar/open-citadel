import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { AudioLines, ChevronUp } from '@/components/icons';
import { DeviceVoiceSheet } from '@/components/device-voice-sheet';
import { ThemedText } from '@/components/themed-text';
import { useDeviceVoices } from '@/components/use-device-voices';
import { Card } from '@/components/ui/card';
import { PrefixIcon } from '@/components/ui/prefix-icon';
import { Touchable } from '@/components/ui/touchable';
import { asColor } from '@/utils/colors';
import { deviceVoiceName, type DeviceVoice } from '@/utils/device-voices';

export interface NativeVoicePickerProps {
  /** The saved phone voice's identifier, '' for the system default. */
  selected: string;
  /** `identifier` and `language` are '' for the system default. */
  onSelect: (identifier: string, language: string) => void;
}

/**
 * The native voice: a row naming the current phone voice that opens the list
 * of every voice the phone has, each with a preview.
 */
export function NativeVoicePicker({ selected, onSelect }: NativeVoicePickerProps) {
  const mutedForeground = useCSSVariable('--color-muted-foreground');
  const [open, setOpen] = React.useState(false);
  const { voices, rows, loading, previewing, preview, stop } = useDeviceVoices();

  const close = React.useCallback(() => {
    stop();
    setOpen(false);
  }, [stop]);

  const handleSelect = React.useCallback(
    (voice: DeviceVoice) => {
      onSelect(voice.identifier, voice.language);
      close();
    },
    [onSelect, close],
  );

  return (
    <>
      <Touchable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel="Choose a phone voice">
        <Card className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-3">
            <PrefixIcon icon={AudioLines} size={36} />
            <ThemedText type="bodyMd">Voice</ThemedText>
          </View>
          <View className="flex-row items-center gap-1">
            <ThemedText type="bodySm" color={asColor(mutedForeground)}>
              {deviceVoiceName(voices, selected)}
            </ThemedText>
            <ChevronUp size={14} color={asColor(mutedForeground)} />
          </View>
        </Card>
      </Touchable>

      <DeviceVoiceSheet
        visible={open}
        onClose={close}
        rows={rows}
        loading={loading}
        selected={selected}
        previewing={previewing}
        onSelect={handleSelect}
        onPreview={preview}
      />
    </>
  );
}
