/**
 * Supertonic, the lighter on-device voice reader.
 *
 * One model for every voice: a voice is a small style file fed to the same
 * weights, so unlike Kokoro there is one pipeline, no accents and nothing to
 * swap when the voice changes. Its registry has ten styles, five female and
 * five male, and all of them are offered.
 *
 * Imports nothing from `catalogue.ts`, which builds the cross-engine helpers
 * on top of this file.
 */

import type { SupertonicTtsModel } from 'react-native-executorch';

import { getExecuTorch } from '@/lib/executorch';

/**
 * The picker's order: female and male alternate, so the first few swipes
 * already show the range. Ids carry a prefix because the registry's own
 * ("F1") are too plain to tell from a phone voice's by sight.
 */
export const SUPERTONIC_VOICES = [
  'st_f1',
  'st_m1',
  'st_f2',
  'st_m2',
  'st_f3',
  'st_m3',
  'st_f4',
  'st_m4',
  'st_f5',
  'st_m5',
] as const;

export type SupertonicVoice = (typeof SUPERTONIC_VOICES)[number];

export function isSupertonicVoice(voice: string | null | undefined): voice is SupertonicVoice {
  return !!voice && (SUPERTONIC_VOICES as readonly string[]).includes(voice);
}

/** The registry's style key for a voice: `st_f1` is its `F1`. */
export function supertonicStyle(voice: SupertonicVoice): string {
  return voice.slice(3).toUpperCase();
}

/** A name worth reading, for the voice picker. The registry only has ids. */
export const SUPERTONIC_LABELS: Record<SupertonicVoice, string> = {
  st_f1: 'Ciri',
  st_m1: 'Nathan',
  st_f2: 'Ellie',
  st_m2: 'Geralt',
  st_f3: 'Aloy',
  st_m3: 'Marcus',
  st_f4: 'Tifa',
  st_m4: 'Joel',
  st_f5: 'Elena',
  st_m5: 'Cole',
};

/** A quick sense of each voice's character, after its maker's own notes. */
export const SUPERTONIC_DESCRIPTIONS: Record<SupertonicVoice, string> = {
  st_f1: 'Calm, steady',
  st_m1: 'Lively, upbeat',
  st_f2: 'Bright, cheerful',
  st_m2: 'Deep, serious',
  st_f3: 'Clear, polished',
  st_m3: 'Assured, formal',
  st_f4: 'Crisp, confident',
  st_m4: 'Soft, friendly',
  st_f5: 'Gentle, soothing',
  st_m5: 'Warm, unhurried',
};

/**
 * The slowest and fastest Supertonic will speak. Outside this range the
 * pipeline refuses the utterance outright, so a reading speed beyond it is
 * held at the nearest end.
 */
export const SUPERTONIC_SPEED = { min: 0.8, max: 1.2 } as const;

/** The reading speeds offered with a Supertonic voice: the ones it can keep. */
export const SUPERTONIC_RATES: readonly number[] = [0.8, 0.9, 1, 1.1, 1.2];

export function supertonicSpeed(speed: number | undefined): number {
  return Math.min(SUPERTONIC_SPEED.max, Math.max(SUPERTONIC_SPEED.min, speed ?? 1));
}

/** The model config, or null when the runtime is not in this binary. */
export function supertonicModel(): SupertonicTtsModel<string> | null {
  const et = getExecuTorch();
  if (!et) return null;
  return et.models.textToSpeech.SUPERTONIC.DEFAULT as SupertonicTtsModel<string>;
}
