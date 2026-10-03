import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { createDeviceVoicesQueryOptions } from '@/query-manager/device-voices';
import { deviceSpeech } from '@/services/device-tts/speech';
import { deviceVoiceRows, usefulLanguages, type DeviceVoice } from '@/utils/device-voices';

const PREVIEW_PHRASE = 'Hello, this is a preview of this voice.';
const NO_VOICES: DeviceVoice[] = [];

/** The phone's own locale, for example `en-ZA`. Hermes resolves it without a native module. */
function phoneLocale(): string {
  return Intl.DateTimeFormat().resolvedOptions().locale;
}

/**
 * The phone's own text-to-speech voices: the cached list, its rows for the
 * picker with only the useful languages open, and previewing one.
 *
 * `selected` is the saved voice's identifier, '' for the system default.
 * Owns no persistence: the picker hands the choice to whoever mounts it.
 */
export function useDeviceVoices(selected: string) {
  const { data, isPending } = useQuery(createDeviceVoicesQueryOptions());
  const voices = data ?? NO_VOICES;
  // Nothing to load in a build without expo-speech, so it never shows a skeleton.
  const loading = isPending && deviceSpeech() !== null;

  const [previewing, setPreviewing] = useState<string | null>(null);
  // Bumped on every preview/stop so a stale `onDone` cannot clear a newer preview.
  const requestRef = useRef(0);

  // The languages opened or closed by hand. Until one is, the useful ones are open.
  const [toggled, setToggled] = useState<ReadonlySet<string> | null>(null);
  const useful = useMemo(() => usefulLanguages(voices, selected, phoneLocale()), [voices, selected]);
  const open = useMemo(() => toggled ?? new Set(useful), [toggled, useful]);
  const rows = useMemo(() => deviceVoiceRows(voices, open, useful), [voices, open, useful]);

  // Stable across toggles, so opening one language does not redraw every row.
  const toggleLanguage = useCallback(
    (language: string) => {
      setToggled((current) => {
        const next = new Set(current ?? useful);
        if (!next.delete(language)) next.add(language);
        return next;
      });
    },
    [useful],
  );

  useEffect(() => {
    return () => {
      requestRef.current += 1;
      void deviceSpeech()?.stop().catch(() => undefined);
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

  return { voices, rows, loading, previewing, preview, stop, toggleLanguage };
}
