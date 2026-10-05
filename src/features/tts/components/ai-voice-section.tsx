import React from 'react';
import { View } from 'react-native';

import { ChoiceChips, type Choice } from '@/components/choice-chips';
import { KeptAlive } from '@/components/kept-alive';
import { ThemedText } from '@/components/themed-text';
import { TtsDownloadCard } from '@/features/tts/components/tts-download-card';
import { VoiceCarousel } from '@/features/tts/components/voice-carousel';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { AiVoice, TtsEngineId } from '@/services/device-tts/catalogue';

/** One engine's voices, and whether they are on the phone yet. */
export type VoiceRoster = { engine: TtsEngineId; voices: readonly AiVoice[]; downloaded: boolean };

export interface AiVoiceSectionProps {
  /** The chosen engine: what the chips show, from the frame of the press. */
  engine: TtsEngineId;
  /** The engine whose controls are on screen, a render behind `engine` at most. */
  shown: TtsEngineId;
  choices: Choice<TtsEngineId>[];
  /** One line on what the chosen engine is like, under the switches. */
  hint: string;
  rosters: VoiceRoster[];
  /** The voice in use, which is one of the chosen engine's. */
  selected: AiVoice;
  /** Build the other engine's voices while they are hidden. See `KeptAlive`. */
  warm: boolean;
  /** Nothing is arriving any more, so every voice's card can be drawn. See `VoiceCarousel`. */
  full: boolean;
  downloadSize: string;
  /** The shown engine's download: 0-1 while it runs, null otherwise. */
  progress: number | null;
  onEngineChange: (engine: TtsEngineId) => void;
  onPick: (voice: AiVoice) => void;
  onDownload: () => void;
  onCancel: () => void;
}

/**
 * The natural voices' controls: which engine reads, then that engine's
 * download card until its files are on the phone, and its voices after.
 *
 * Each engine's run of voices is kept once drawn, so going back to an engine
 * shows it where it was left instead of building its cards again.
 */
export function AiVoiceSection({
  engine,
  shown,
  choices,
  hint,
  rosters,
  selected,
  warm,
  full,
  downloadSize,
  progress,
  onEngineChange,
  onPick,
  onDownload,
  onCancel,
}: AiVoiceSectionProps) {
  const tokens = useThemeTokens();
  const ready = rosters.filter((roster) => roster.downloaded);
  const needsDownload = !ready.some((roster) => roster.engine === shown);

  return (
    <View className="gap-4">
      {/* The line sits under the switches it describes, not between their
          label and them: it is what the chosen one is like, so it reads
          after the choice. */}
      <View className="gap-2">
        <ChoiceChips label="ENGINE" choices={choices} value={engine} onChange={onEngineChange} gutter="none" />
        <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
          {hint}
        </ThemedText>
      </View>
      {ready.map((roster) => (
        <KeptAlive key={roster.engine} active={roster.engine === shown} warm={warm}>
          <VoiceCarousel
            voices={roster.voices}
            selected={roster.engine === engine ? selected : null}
            onPick={onPick}
            full={full}
          />
        </KeptAlive>
      ))}
      {needsDownload ? (
        <TtsDownloadCard size={downloadSize} progress={progress} onDownload={onDownload} onCancel={onCancel} />
      ) : null}
    </View>
  );
}
