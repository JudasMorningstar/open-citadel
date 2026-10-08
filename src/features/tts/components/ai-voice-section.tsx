import { View } from "react-native";

import { ChoiceChips, type Choice } from "@/components/choice-chips";
import { ThemedText } from "@/components/themed-text";
import { EnhancedVoicePicker } from "@/features/tts/components/enhanced-voice-picker";
import { TtsDownloadCard } from "@/features/tts/components/tts-download-card";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import type { AiVoice, TtsEngineId } from "@/services/device-tts/catalogue";

export interface AiVoiceSectionProps {
  /** The chosen voice box. */
  engine: TtsEngineId;
  choices: Choice<TtsEngineId>[];
  /** One line on what the chosen voice box is like, under the switches. */
  hint: string;
  /** The chosen voice box's voices. */
  voices: readonly AiVoice[];
  /** Whether those voices are on the phone yet. */
  downloaded: boolean;
  /** The voice in use, which is one of them. */
  selected: AiVoice;
  downloadSize: string;
  /** The chosen voice box's download: 0-1 while it runs, null otherwise. */
  progress: number | null;
  onEngineChange: (engine: TtsEngineId) => void;
  onPick: (voice: AiVoice) => void;
  onDownload: () => void;
  onCancel: () => void;
}

/**
 * The Enhanced voices' controls: which voice box reads, then that box's
 * download card until its files are on the phone, and the row that picks one
 * of its voices after.
 *
 * Nothing here is dear to build any more (the voices are a row, and a list
 * only once it is opened), so the chosen box's controls are drawn in the same
 * pass as the press that chose it.
 */
export function AiVoiceSection({
  engine,
  choices,
  hint,
  voices,
  downloaded,
  selected,
  downloadSize,
  progress,
  onEngineChange,
  onPick,
  onDownload,
  onCancel,
}: AiVoiceSectionProps) {
  const tokens = useThemeTokens();

  return (
    <View className="gap-4">
      {/* The line sits under the switches it describes, not between their
          label and them: it is what the chosen one is like, so it reads
          after the choice. */}
      <View className="gap-2">
        <ChoiceChips
          label="VOICE BOX"
          choices={choices}
          value={engine}
          onChange={onEngineChange}
          gutter="none"
          fill
        />
        <ThemedText type="bodySm" color={tokens["--color-muted-foreground"]}>
          {hint}
        </ThemedText>
      </View>
      {downloaded ? (
        <EnhancedVoicePicker
          voices={voices}
          selected={selected}
          onPick={onPick}
        />
      ) : (
        <TtsDownloadCard
          size={downloadSize}
          progress={progress}
          onDownload={onDownload}
          onCancel={onCancel}
        />
      )}
    </View>
  );
}
