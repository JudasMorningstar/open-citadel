/**
 * Kokoro, the on-device voice reader.
 *
 * One entry for v1: English (US). ExecuTorch's own `DEFAULT` picks the
 * Core ML export on a binary that carries it and XNNPACK otherwise — unlike
 * the LLM catalogue, that default is exactly right here, since Kokoro has no
 * tool-calling tradeoff to protect against.
 */

import type { KokoroTtsModel } from 'react-native-executorch';

import { getExecuTorch } from '@/lib/executorch';

export const KOKORO_EN_US_VOICES = ['af_heart', 'af_river', 'af_sarah', 'am_adam', 'am_michael', 'am_santa'] as const;

export type KokoroVoice = (typeof KOKORO_EN_US_VOICES)[number];

export const DEFAULT_VOICE: KokoroVoice = 'af_heart';

/** A name worth reading, for the voice picker. The registry only has ids. */
export const VOICE_LABELS: Record<KokoroVoice, string> = {
  af_heart: 'Yennefer',
  af_river: 'Lara',
  af_sarah: 'Chloe',
  am_adam: 'Arthur',
  am_michael: 'Leon',
  am_santa: 'Sully',
};

/** A quick sense of each voice's character, for the voice picker. */
export const VOICE_DESCRIPTIONS: Record<KokoroVoice, string> = {
  af_heart: 'Warm, low',
  af_river: 'Bright, clear',
  af_sarah: 'Soft, calm',
  am_adam: 'Deep, measured',
  am_michael: 'Crisp, even',
  am_santa: 'Old, energetic',
};

/**
 * The known voice for a persisted `ttsVoice` setting, which is a plain
 * `string | null` (loaded back from the database, not narrowed at the type
 * level) — falls back to `DEFAULT_VOICE` for `null` or a value the roster no
 * longer has, e.g. after a voice is retired.
 */
export function resolveVoice(voice: string | null): KokoroVoice {
  return (KOKORO_EN_US_VOICES as readonly string[]).includes(voice ?? '') ? (voice as KokoroVoice) : DEFAULT_VOICE;
}

/** The registry's model for this device, or null when the runtime is not in this binary. */
export function kokoroModel(): KokoroTtsModel<KokoroVoice> | null {
  const et = getExecuTorch();
  return (et?.models.textToSpeech.KOKORO.EN_US.DEFAULT as KokoroTtsModel<KokoroVoice> | undefined) ?? null;
}
