import { useCallback, useDeferredValue, useEffect, useMemo, useRef } from 'react';

import type { Choice } from '@/components/choice-chips';
import type { AiVoiceSectionProps, VoiceRoster } from '@/features/tts/components/ai-voice-section';
import {
  ENGINE_INFO,
  TTS_ENGINES,
  engineOf,
  isAiVoice,
  resolveVoice,
  voicesOf,
  type AiVoice,
  type TtsEngineId,
} from '@/services/device-tts/catalogue';
import { SUPERTONIC_RATES } from '@/services/device-tts/supertonic';
import { useSettledAfter } from '@/navigation/use-settled-after';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';

/** Longer than a sheet's rise or a page's slide. */
const ARRIVED_AFTER_MS = 700;

const ENGINE_CHOICES: Choice<TtsEngineId>[] = TTS_ENGINES.map((engine) => ({
  value: engine,
  label: ENGINE_INFO[engine].label,
}));

/**
 * Which on-device engine the reading voice uses, each engine's voices, and
 * the chosen engine's download.
 *
 * The engine is never saved on its own: it is the one the remembered AI voice
 * belongs to, so choosing an engine is choosing one of its voices. That is the
 * voice the engine was last left on in this visit, or its first.
 *
 * `shown` trails `engine` by a render when the engine's voices have to be
 * built first: the chip answers the press, and the run under it follows.
 */
export function useAiVoiceEngine({ warm = false }: { warm?: boolean } = {}) {
  // Nothing is arriving: the caller says so (`warm`), or failing that signal
  // (a sheet has none to give) long enough has passed. Deferred from false, so
  // the first pass draws only the cards in view and the rest are filled in as
  // work React can put down for a press.
  const arrived = useSettledAfter(ARRIVED_AFTER_MS);
  const full = useDeferredValue(warm || arrived, false);
  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const ttsNaturalVoice = useSettingsStore((s) => s.ttsNaturalVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const packs = useTtsStore((s) => s.packs);
  const downloadModel = useTtsStore((s) => s.downloadModel);
  const cancelDownload = useTtsStore((s) => s.cancelDownload);

  // The active voice when it is an AI one; in phone mode, the AI voice that
  // switching back would return to.
  const selected = resolveVoice(isAiVoice(ttsVoice) ? ttsVoice : ttsNaturalVoice);
  const engine = engineOf(selected);
  const shown = useDeferredValue(engine);

  const leftOn = useRef<Partial<Record<TtsEngineId, AiVoice>>>({});
  useEffect(() => {
    leftOn.current[engine] = selected;
  }, [engine, selected]);

  const onEngineChange = useCallback(
    (next: TtsEngineId) => void setTtsVoice(leftOn.current[next] ?? voicesOf(next)[0]!),
    [setTtsVoice],
  );
  const onPick = useCallback((voice: AiVoice) => void setTtsVoice(voice), [setTtsVoice]);
  const onDownload = useCallback(() => void downloadModel(shown), [downloadModel, shown]);
  const onCancel = useCallback(() => cancelDownload(shown), [cancelDownload, shown]);

  return useMemo(() => {
    const rosters: VoiceRoster[] = TTS_ENGINES.map((id) => ({
      engine: id,
      voices: voicesOf(id),
      downloaded: packs[id].isDownloaded,
    }));
    const section: AiVoiceSectionProps = {
      engine,
      shown,
      choices: ENGINE_CHOICES,
      hint: ENGINE_INFO[engine].hint,
      rosters,
      selected,
      warm,
      full,
      downloadSize: ENGINE_INFO[shown].downloadSize,
      progress: packs[shown].downloadProgress,
      onEngineChange,
      onPick,
      onDownload,
      onCancel,
    };
    return {
      section,
      /** The engine on screen has its voices, so there is a speed to set. */
      downloaded: packs[shown].isDownloaded,
      /** The speeds the engine on screen can read at, or undefined for the full range. */
      rates: shown === 'supertonic' ? SUPERTONIC_RATES : undefined,
    };
  }, [engine, shown, selected, warm, full, packs, onEngineChange, onPick, onDownload, onCancel]);
}
