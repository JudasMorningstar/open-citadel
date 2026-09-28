/**
 * Kokoro, the on-device voice reader.
 *
 * English in two accents, US and GB. ExecuTorch's registry has no other
 * English (no Irish, Australian, African...), and one Kokoro pipeline takes a
 * single phonemizer, so each accent is its own model config sharing the same
 * weights. ExecuTorch's own `DEFAULT` picks the Core ML export on a binary that
 * carries it and XNNPACK otherwise — unlike the LLM catalogue, that default is
 * exactly right here, since Kokoro has no tool-calling tradeoff to protect
 * against.
 */

import type { KokoroTtsModel } from 'react-native-executorch';
import * as Device from 'expo-device';

import { getExecuTorch } from '@/lib/executorch';

/**
 * The picker's order. Accents alternate so the first few swipes already show
 * the range, rather than four American voices before the first British one.
 */
export const KOKORO_VOICES = [
  'af_heart',
  'bf_emma',
  'am_adam',
  'bm_daniel',
  'af_river',
  'am_michael',
  'af_sarah',
  'am_santa',
] as const;

export type KokoroVoice = (typeof KOKORO_VOICES)[number];

export type KokoroAccent = 'us' | 'gb';

export const VOICE_ACCENTS: Record<KokoroVoice, KokoroAccent> = {
  af_heart: 'us',
  bf_emma: 'gb',
  am_adam: 'us',
  bm_daniel: 'gb',
  af_river: 'us',
  am_michael: 'us',
  af_sarah: 'us',
  am_santa: 'us',
};

export const ACCENT_LABELS: Record<KokoroAccent, string> = { us: 'US', gb: 'UK' };

export const DEFAULT_VOICE: KokoroVoice = 'af_heart';

/**
 * The "native" reading voice: the phone's own text-to-speech (Android's
 * TextToSpeech, iOS's AVSpeechSynthesizer), through Readium's built-in engine.
 * The native side of the reader matches this exact string.
 */
export const DEVICE_VOICE = 'system-voice' as const;
export type ReaderVoice = KokoroVoice | typeof DEVICE_VOICE;

/** Both native readers have a device-voice path; only the web reader has neither. */
export const NATIVE_VOICE_AVAILABLE = process.env.EXPO_OS === 'android' || process.env.EXPO_OS === 'ios';

/**
 * Whether the native voice follows the reading speed. Android's does; on iOS
 * Readium's `AVTTSEngine` ignores the rate it is given, so the control would
 * do nothing there.
 */
export const NATIVE_SPEED_SUPPORTED = process.env.EXPO_OS === 'android';

/**
 * Kokoro's FP32 model is about 330 MB of weights and exhausted a 2 GB emulator
 * during book playback. Running out of memory kills the native runtime, which
 * JS cannot catch, so a phone this small is never asked to load it.
 */
export const LOW_MEMORY_ANDROID = process.env.EXPO_OS === 'android'
  && Device.totalMemory !== null
  && Device.totalMemory < 3 * 1024 ** 3;

/** What the AI voices cost to download, for the prompt. Kokoro's weights plus the two accents' extras. */
export const AI_VOICES_DOWNLOAD_SIZE = '350 MB';

/** Whether this device can run the AI voices at all. */
export const AI_VOICES_SUPPORTED = !LOW_MEMORY_ANDROID;

/** Which of the reader's two voice kinds a persisted `ttsVoice` setting selects. */
export type VoiceMode = 'ai' | 'native';

/** Whether `voice` is one of the AI (Kokoro) voice ids, as opposed to a phone voice. */
export function isKokoroVoice(voice: string | null | undefined): voice is KokoroVoice {
  return !!voice && (KOKORO_VOICES as readonly string[]).includes(voice);
}

/**
 * The mode a persisted `ttsVoice` puts the reader in. The AI voices come first:
 * no choice yet (`null`) or one of their ids is AI. Anything else, the
 * "system-voice" default or a specific phone voice, is native. A phone that
 * cannot hold the AI voices is always native, whatever was saved before.
 */
export function voiceMode(voice: string | null): VoiceMode {
  if (!NATIVE_VOICE_AVAILABLE) return 'ai';
  if (!AI_VOICES_SUPPORTED) return 'native';
  return voice === null || isKokoroVoice(voice) ? 'ai' : 'native';
}

/** A name worth reading, for the voice picker. The registry only has ids. */
export const VOICE_LABELS: Record<KokoroVoice, string> = {
  af_heart: 'Yennefer',
  bf_emma: 'Emma',
  am_adam: 'Arthur',
  bm_daniel: 'Winston',
  af_river: 'Lara',
  am_michael: 'Leon',
  af_sarah: 'Chloe',
  am_santa: 'Sully',
};

/** A quick sense of each voice's character, for the voice picker. */
export const VOICE_DESCRIPTIONS: Record<KokoroVoice, string> = {
  af_heart: 'Warm, low',
  bf_emma: 'Poised, clear',
  am_adam: 'Deep, measured',
  bm_daniel: 'Steady, formal',
  af_river: 'Bright, clear',
  am_michael: 'Crisp, even',
  af_sarah: 'Soft, calm',
  am_santa: 'Old, energetic',
};

/**
 * The known voice for a persisted `ttsVoice` setting, which is a plain
 * `string | null` (loaded back from the database, not narrowed at the type
 * level) — falls back to `DEFAULT_VOICE` for `null` or a value the roster no
 * longer has, e.g. after a voice is retired.
 */
export function resolveVoice(voice: string | null): KokoroVoice {
  return isKokoroVoice(voice) ? voice : DEFAULT_VOICE;
}

/** One model config per accent, or null when the runtime is not in this binary. */
export function kokoroModels(): Record<KokoroAccent, KokoroTtsModel<string>> | null {
  const et = getExecuTorch();
  if (!et) return null;
  const { EN_US, EN_GB } = et.models.textToSpeech.KOKORO;
  return { us: EN_US.DEFAULT as KokoroTtsModel<string>, gb: EN_GB.DEFAULT as KokoroTtsModel<string> };
}
