import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { NativeVoicePicker } from '@/features/tts/components/native-voice-picker';
import { ReadingSpeedStepper } from '@/features/tts/components/reading-speed-stepper';
import { ThemedText } from '@/components/themed-text';
import { KeptAlive } from '@/components/kept-alive';
import { AiVoiceSection } from '@/features/tts/components/ai-voice-section';
import { useAiVoiceEngine } from '@/features/tts/hooks/use-ai-voice-engine';
import { TtsModeCards } from '@/features/tts/components/tts-mode-cards';
import { Touchable } from '@/components/ui/touchable';
import {
  AI_VOICES_SUPPORTED,
  DEFAULT_VOICE,
  DEVICE_VOICE,
  NATIVE_SPEED_SUPPORTED,
  NATIVE_VOICE_AVAILABLE,
  isAiVoice,
  voiceMode,
} from '@/services/device-tts/catalogue';
import { prefetchDeviceVoices } from '@/query-manager/device-voices';
import { useSettingsStore } from '@/stores/settings';
import { asColor } from '@/utils/colors';

export interface TtsSettingsPanelProps {
  /** Closes the sheet this panel is mounted in, shown as a "DONE" control
   * beside the panel's heading. Omitted in Settings, which has its own
   * header and its own way back. */
  onDone?: () => void;
  /**
   * Build the controls that are not showing while they are hidden, so
   * choosing them only reveals them (`KeptAlive`). For Settings, whose pane
   * is itself built after the screen has landed; a sheet leaves it off, since
   * it would build them mid-rise.
   */
  warm?: boolean;
}

/**
 * The reading voice's settings. Two choices, AI first and native (the phone's
 * own voices) as the fallback for phones that cannot run it, and each shows
 * its own controls:
 *
 * - AI: which engine reads (Supertonic or Kokoro), then that engine's download
 *   card until its voices are on the device, and only then the voice carousel
 *   and reading speed. Before that there is nothing to preview or pick.
 * - Native: the list of the phone's voices, and reading speed (Android only).
 *   Nothing to download.
 *
 * Where there is no native path at all (web), only the AI controls show.
 *
 * The mode cards answer the press and the controls under them follow a render
 * behind when they have to be built first. Controls drawn once are kept, so
 * going back to them is a reveal.
 *
 * Otherwise self-contained: it and the components it hosts read and write
 * `useSettingsStore`/`useTtsStore` directly, so the Settings page and the
 * reader's own long-press quick-settings sheet can both mount it and always
 * show the same state.
 */
export function TtsSettingsPanel({ onDone, warm = false }: TtsSettingsPanelProps) {
  const [mutedForeground, primary] = useCSSVariable(['--color-muted-foreground', '--color-primary']);

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const ttsNaturalVoice = useSettingsStore((s) => s.ttsNaturalVoice);
  const ttsPhoneVoice = useSettingsStore((s) => s.ttsPhoneVoice);
  const ttsPhoneVoiceLanguage = useSettingsStore((s) => s.ttsPhoneVoiceLanguage);
  const ai = useAiVoiceEngine({ warm });

  React.useEffect(() => {
    // The phone's first answer is the slow one, so it is asked for now,
    // whichever kind of voice is chosen, not when the list is opened.
    if (NATIVE_VOICE_AVAILABLE) prefetchDeviceVoices();
  }, []);

  const mode = voiceMode(ttsVoice);
  const shownMode = React.useDeferredValue(mode);
  const showSpeed = shownMode === 'native' ? NATIVE_SPEED_SUPPORTED : ai.downloaded;

  // The saved phone voice's identifier, '' for the system default (which is
  // also what an AI voice or nothing at all means here).
  const nativeVoiceId = isAiVoice(ttsVoice) || ttsVoice === DEVICE_VOICE ? '' : (ttsVoice ?? '');
  const nativeNote = NATIVE_SPEED_SUPPORTED ? null : 'Reading speed cannot be changed with a phone voice.';

  const selectAi = () => {
    if (mode !== 'ai') void setTtsVoice(ttsNaturalVoice ?? DEFAULT_VOICE);
  };
  const selectNative = () => {
    if (mode !== 'native') void setTtsVoice(ttsPhoneVoice || DEVICE_VOICE, ttsPhoneVoiceLanguage);
  };
  const selectPhoneVoice = React.useCallback(
    (identifier: string, language: string) => {
      void setTtsVoice(identifier || DEVICE_VOICE, language || null);
    },
    [setTtsVoice],
  );

  return (
    <View className="gap-4">
      {onDone ? (
        <View className="flex-row items-baseline justify-between">
          <ThemedText type="labelSm" color={asColor(mutedForeground)}>
            READING VOICE
          </ThemedText>
          <Touchable onPress={onDone} haptic="tap" hitSlop={8}>
            <ThemedText type="labelSm" color={asColor(primary)}>
              DONE
            </ThemedText>
          </Touchable>
        </View>
      ) : null}

      {NATIVE_VOICE_AVAILABLE && (
        <TtsModeCards
          mode={mode}
          aiSupported={AI_VOICES_SUPPORTED}
          aiDownloaded={ai.downloaded}
          onSelectAi={selectAi}
          onSelectNative={selectNative}
        />
      )}

      <KeptAlive active={shownMode === 'native'} warm={warm}>
        <View className="gap-2">
          <NativeVoicePicker selected={nativeVoiceId} onSelect={selectPhoneVoice} />
          {nativeNote && (
            <ThemedText type="bodySm" color={asColor(mutedForeground)}>
              {nativeNote}
            </ThemedText>
          )}
        </View>
      </KeptAlive>
      <KeptAlive active={shownMode === 'ai'} warm={warm}>
        <AiVoiceSection {...ai.section} />
      </KeptAlive>

      {showSpeed && <ReadingSpeedStepper rates={shownMode === 'ai' ? ai.rates : undefined} />}
    </View>
  );
}
