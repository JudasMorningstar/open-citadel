import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deviceSpeech } from '@/services/device-tts/speech';
import { deviceVoiceRows, isPlayableVoice, type DeviceVoice } from '@/utils/device-voices';

const PREVIEW_PHRASE = 'Hello, this is a preview of this voice.';

/**
 * The phone's own text-to-speech voices: loading them, grouping them for the
 * picker's list, and previewing one.
 *
 * Owns no persistence — the picker hands the choice to whoever mounts it.
 */
export function useDeviceVoices() {
  const [voices, setVoices] = useState<DeviceVoice[]>([]);
  // Nothing to load in a build without expo-speech, so it never shows a skeleton.
  const [loading, setLoading] = useState(() => deviceSpeech() !== null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  // Bumped on every preview/stop so a stale `onDone` cannot clear a newer preview.
  const requestRef = useRef(0);

  useEffect(() => {
    let active = true;
    const speech = deviceSpeech();
    if (!speech) return;
    speech
      .getAvailableVoicesAsync()
      .then((available) => {
        if (!active) return;
        setVoices(
          available.filter(isPlayableVoice).map((voice) => ({
            identifier: voice.identifier,
            name: voice.name,
            language: voice.language,
            quality: voice.quality === speech.VoiceQuality.Enhanced ? 'ENHANCED' : 'DEFAULT',
          })),
        );
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
      requestRef.current += 1;
      void speech.stop().catch(() => undefined);
    };
  }, []);

  const stop = useCallback(() => {
    requestRef.current += 1;
    void deviceSpeech()?.stop().catch(() => undefined);
    setPreviewing(null);
  }, []);

  const preview = useCallback(
    async (item: DeviceVoice) => {
      const speech = deviceSpeech();
      const request = ++requestRef.current;
      await speech?.stop().catch(() => undefined);
      if (!speech || request !== requestRef.current) return;

      if (previewing === item.identifier) {
        setPreviewing(null);
        return;
      }

      setPreviewing(item.identifier);
      const finish = () => {
        if (request === requestRef.current) setPreviewing(null);
      };
      speech.speak(PREVIEW_PHRASE, {
        voice: item.identifier || undefined,
        language: item.language || undefined,
        onDone: finish,
        onStopped: finish,
        onError: finish,
      });
    },
    [previewing],
  );

  const rows = useMemo(() => deviceVoiceRows(voices), [voices]);

  return { voices, rows, loading, previewing, preview, stop };
}
