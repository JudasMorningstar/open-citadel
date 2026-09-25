import React from 'react';

import { DEFAULT_VOICE, KOKORO_EN_US_VOICES, VOICE_LABELS, type KokoroVoice } from '@/services/device-tts/catalogue';

export type VoiceItem = {
  identifier: KokoroVoice;
  name: string;
  language: string;
};

/** One row of the picker: a voice. No language grouping — EN_US only for now. */
export type VoiceListRow = { kind: 'voice'; key: string; voice: VoiceItem };

const VOICES: VoiceItem[] = KOKORO_EN_US_VOICES.map((identifier) => ({
  identifier,
  name: VOICE_LABELS[identifier],
  language: 'English (US)',
}));

/**
 * Everything the TTS voice picker needs: opening, the fixed Kokoro roster,
 * and naming the current choice for the row on the settings body.
 *
 * Owns no persistence — `select` hands the choice back; the caller writes it
 * to the settings store.
 */
export function useVoicePicker(currentVoice: string | null) {
  const [visible, setVisible] = React.useState(false);

  const open = React.useCallback(() => {
    setVisible(true);
  }, []);

  const close = React.useCallback(() => {
    setVisible(false);
  }, []);

  const select = React.useCallback((identifier: string | null, language: string | null) => {
    setVisible(false);
    return { identifier, language };
  }, []);

  const rows: VoiceListRow[] = React.useMemo(
    () => VOICES.map((voice) => ({ kind: 'voice' as const, key: voice.identifier, voice })),
    [],
  );

  const currentName = React.useMemo(() => {
    const match = VOICES.find((voice) => voice.identifier === currentVoice);
    return match?.name ?? VOICE_LABELS[DEFAULT_VOICE];
  }, [currentVoice]);

  return { visible, loading: false, rows, currentName, open, close, select };
}
