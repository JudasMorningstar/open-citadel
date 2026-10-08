import { useCallback } from 'react';

import { DEFAULT_VOICE, DEVICE_VOICE, isAiVoice, voiceMode, type VoiceMode } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';

/**
 * Which kind of on-device voice reads, and the ways to change it.
 *
 * The kind is never saved on its own: it is the kind of the saved voice. So
 * choosing a kind is choosing a voice of that kind, and each kind remembers
 * the voice it was last left on, which is what switching back returns to.
 */
export function useVoiceKind() {
  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const ttsNaturalVoice = useSettingsStore((s) => s.ttsNaturalVoice);
  const ttsPhoneVoice = useSettingsStore((s) => s.ttsPhoneVoice);
  const ttsPhoneVoiceLanguage = useSettingsStore((s) => s.ttsPhoneVoiceLanguage);

  const mode = voiceMode(ttsVoice);

  const selectKind = (next: VoiceMode) => {
    if (next === mode) return;
    if (next === 'ai') void setTtsVoice(ttsNaturalVoice ?? DEFAULT_VOICE);
    else void setTtsVoice(ttsPhoneVoice || DEVICE_VOICE, ttsPhoneVoiceLanguage);
  };

  /** `identifier` and `language` are '' for the system default. */
  const selectPhoneVoice = useCallback(
    (identifier: string, language: string) => {
      void setTtsVoice(identifier || DEVICE_VOICE, language || null);
    },
    [setTtsVoice],
  );

  return {
    mode,
    // The saved phone voice's identifier, '' for the system default (which is
    // also what an Enhanced voice or nothing at all means here).
    liteVoiceId: isAiVoice(ttsVoice) || ttsVoice === DEVICE_VOICE ? '' : (ttsVoice ?? ''),
    selectKind,
    selectPhoneVoice,
  };
}
