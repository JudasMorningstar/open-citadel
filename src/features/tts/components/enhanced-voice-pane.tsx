import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AiVoiceSection, type AiVoiceSectionProps } from '@/features/tts/components/ai-voice-section';
import { ReadingSpeedStepper } from '@/features/tts/components/reading-speed-stepper';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export interface EnhancedVoicePaneProps {
  /** What Enhanced voices are, in one line. Left out where there is no switch to explain. */
  hint: string | null;
  /** How this phone copes with them, beside the line. */
  mark: React.ReactNode;
  section: AiVoiceSectionProps;
  /** The chosen voice box has its voices, so there is a speed to set. */
  showSpeed: boolean;
  /** The speeds the chosen voice box can read at, or undefined for the full range. */
  rates: readonly number[] | undefined;
}

/** Everything that belongs to the Enhanced voices: their line, the voice box, the voice, and its speed. */
export function EnhancedVoicePane({ hint, mark, section, showSpeed, rates }: EnhancedVoicePaneProps) {
  const muted = useThemeTokens()['--color-muted-foreground'];
  return (
    <View className="gap-4">
      {hint ? (
        // Wraps as one run, so the mark drops under the line on a narrow
        // phone or at large type instead of squeezing it.
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
          <ThemedText type="bodySm" color={muted}>
            {hint}
          </ThemedText>
          {mark}
        </View>
      ) : null}
      <AiVoiceSection {...section} />
      {showSpeed ? <ReadingSpeedStepper rates={rates} /> : null}
    </View>
  );
}
