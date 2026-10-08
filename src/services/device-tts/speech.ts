/**
 * The phone's own text-to-speech (`expo-speech`), the "native" reading voice.
 * Shared by the voice picker and the AI voice preview's fallback.
 */

import { isPlayableVoice, sortVoices, type DeviceVoice } from '@/utils/device-voices';

type SpeechModule = typeof import('expo-speech');
let speechModule: SpeechModule | null | undefined;

/** The module, or null in a dev build made before `expo-speech` was added. */
export function deviceSpeech(): SpeechModule | null {
  if (speechModule !== undefined) return speechModule;
  try {
    // The currently installed dev build may predate expo-speech. Keep voice
    // settings usable until a new native build is installed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    speechModule = require('expo-speech') as SpeechModule;
  } catch {
    speechModule = null;
  }
  return speechModule;
}

/**
 * Every voice the phone's engine has, in a fixed order, or none in a build
 * without `expo-speech`.
 *
 * The first call is the slow one: it binds the phone's speech service and
 * waits for it to come up. So the answer is kept in the query cache for the
 * session (`query-manager/device-voices`) rather than asked for again each
 * time the voice settings open.
 */
export async function listDeviceVoices(): Promise<DeviceVoice[]> {
  const speech = deviceSpeech();
  if (!speech) return [];
  const available = await speech.getAvailableVoicesAsync();
  return sortVoices(
    available.filter(isPlayableVoice).map((voice) => ({
      identifier: voice.identifier,
      name: voice.name,
      language: voice.language,
      // The phone calls its better voices "enhanced". That word is taken:
      // Enhanced is this app's name for the voices it downloads, and the
      // same word on a Lite voice said it was one of those. So the phone's
      // better voices are marked HD, and its ordinary ones carry no mark.
      quality: voice.quality === speech.VoiceQuality.Enhanced ? 'HD' : '',
    })),
  );
}
