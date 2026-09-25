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
  af_heart: 'Heart',
  af_river: 'River',
  af_sarah: 'Sarah',
  am_adam: 'Adam',
  am_michael: 'Michael',
  am_santa: 'Santa',
};

/** The registry's model for this device, or null when the runtime is not in this binary. */
export function kokoroModel(): KokoroTtsModel<KokoroVoice> | null {
  const et = getExecuTorch();
  return (et?.models.textToSpeech.KOKORO.EN_US.DEFAULT as KokoroTtsModel<KokoroVoice> | undefined) ?? null;
}
