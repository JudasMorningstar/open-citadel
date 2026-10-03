import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { NativeVoicePicker } from '@/features/tts/components/native-voice-picker';
import { ReadingSpeedStepper } from '@/features/tts/components/reading-speed-stepper';
import { ThemedText } from '@/components/themed-text';
import { TtsDownloadCard } from '@/features/tts/components/tts-download-card';
import { TtsModeCards } from '@/features/tts/components/tts-mode-cards';
import { Touchable } from '@/components/ui/touchable';
import { VoiceCarousel } from '@/features/tts/components/voice-carousel';
import {
  AI_VOICES_SUPPORTED,
  DEFAULT_VOICE,
  DEVICE_VOICE,
  NATIVE_SPEED_SUPPORTED,
  NATIVE_VOICE_AVAILABLE,
  isKokoroVoice,
  voiceMode,
} from '@/services/device-tts/catalogue';
import { prefetchDeviceVoices } from '@/query-manager/device-voices';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';

export interface TtsSettingsPanelProps {
  /** Closes the sheet this panel is mounted in, shown as a "DONE" control
   * next to the panel's header. Omitted on the Settings screen, which has its
   * own back navigation and nothing to close here. */
  onDone?: () => void;
}

/**
 * The reading voice's settings. Two choices, AI (Kokoro) first and native (the
 * phone's own voices) as the fallback for phones that cannot run it, and each
 * shows its own controls:
 *
 * - AI: the download card until the voices are on the device, and only then
 *   the voice carousel and reading speed. Before that there is nothing to
 *   preview or pick.
 * - Native: the list of the phone's voices, and reading speed (Android only).
 *   Nothing to download.
 *
 * Where there is no native path at all (web), only the AI controls show.
 *
 * Otherwise self-contained — it and the components it hosts read and write
 * `useSettingsStore`/`useTtsStore` directly, so the Settings screen and the
 * reader's own long-press quick-settings sheet can both mount it and always
 * show the same state.
 */
export function TtsSettingsPanel({ onDone }: TtsSettingsPanelProps) {
  const [mutedForeground, primary] = useCSSVariable(['--color-muted-foreground', '--color-primary']);

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const ttsNaturalVoice = useSettingsStore((s) => s.ttsNaturalVoice);
  const ttsPhoneVoice = useSettingsStore((s) => s.ttsPhoneVoice);
  const ttsPhoneVoiceLanguage = useSettingsStore((s) => s.ttsPhoneVoiceLanguage);
  const isDownloaded = useTtsStore((s) => s.isDownloaded);
  const downloadProgress = useTtsStore((s) => s.downloadProgress);
  const loadError = useTtsStore((s) => s.loadError);
  const downloadModel = useTtsStore((s) => s.downloadModel);
  const cancelDownload = useTtsStore((s) => s.cancelDownload);

  React.useEffect(() => {
    void useTtsStore.getState().loadState();
    // The phone's first answer is the slow one, so it is asked for now,
    // whichever kind of voice is chosen, not when the list is opened.
    if (NATIVE_VOICE_AVAILABLE) prefetchDeviceVoices();
  }, []);

  const mode = voiceMode(ttsVoice);
  const showSpeed = mode === 'native' ? NATIVE_SPEED_SUPPORTED : isDownloaded;

  // The saved phone voice's identifier, '' for the system default (which is
  // also what an AI voice or nothing at all means here).
  const nativeVoiceId = isKokoroVoice(ttsVoice) || ttsVoice === DEVICE_VOICE ? '' : (ttsVoice ?? '');
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
      <View className="flex-row items-baseline justify-between">
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>
          READING VOICE
        </ThemedText>
        {onDone ? (
          <Touchable onPress={onDone} haptic="tap" hitSlop={8}>
            <ThemedText type="labelSm" color={asColor(primary)}>
              DONE
            </ThemedText>
          </Touchable>
        ) : null}
      </View>

      {NATIVE_VOICE_AVAILABLE && (
        <TtsModeCards
          mode={mode}
          aiSupported={AI_VOICES_SUPPORTED}
          aiDownloaded={isDownloaded}
          onSelectAi={selectAi}
          onSelectNative={selectNative}
        />
      )}

      {mode === 'native' ? (
        <View className="gap-2">
          <NativeVoicePicker selected={nativeVoiceId} onSelect={selectPhoneVoice} />
          {nativeNote && (
            <ThemedText type="bodySm" color={asColor(mutedForeground)}>
              {nativeNote}
            </ThemedText>
          )}
        </View>
      ) : isDownloaded ? (
        <VoiceCarousel />
      ) : (
        <TtsDownloadCard
          progress={downloadProgress}
          error={loadError}
          onDownload={() => void downloadModel()}
          onCancel={cancelDownload}
        />
      )}

      {showSpeed && <ReadingSpeedStepper />}
    </View>
  );
}
