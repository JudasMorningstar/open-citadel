import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { NativeVoicePicker } from '@/features/tts/components/native-voice-picker';
import { ReadingSpeedStepper } from '@/features/tts/components/reading-speed-stepper';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export interface LiteVoicePaneProps {
  /** What Lite voices are, in one line. Left out where there is no switch to explain. */
  hint: string | null;
  /** The saved phone voice's identifier, '' for the system default. */
  selected: string;
  onSelect: (identifier: string, language: string) => void;
  /** Something to say under the voice, e.g. that its speed cannot be changed here. */
  note: string | null;
  showSpeed: boolean;
}

/** Everything that belongs to the Lite voices: their line, the voice, and its speed. */
export function LiteVoicePane({ hint, selected, onSelect, note, showSpeed }: LiteVoicePaneProps) {
  const muted = useThemeTokens()['--color-muted-foreground'];
  return (
    <View className="gap-4">
      {hint ? (
        <ThemedText type="bodySm" color={muted}>
          {hint}
        </ThemedText>
      ) : null}
      <View className="gap-2">
        <NativeVoicePicker selected={selected} onSelect={onSelect} />
        {note ? (
          <ThemedText type="bodySm" color={muted}>
            {note}
          </ThemedText>
        ) : null}
      </View>
      {showSpeed ? <ReadingSpeedStepper /> : null}
    </View>
  );
}
