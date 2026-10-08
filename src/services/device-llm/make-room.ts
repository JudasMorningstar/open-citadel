/**
 * Frees what the app can spare before a brain is loaded on a phone where it
 * is a tight fit (`wakeRoom`).
 *
 * Two things are worth the trouble. The Kokoro voice is a second model held
 * in memory for as long as the app lives once anything has been read aloud,
 * and two models at once is the likeliest way to be killed on these phones.
 * Decoded covers and artwork are tens of megabytes that come back from disk
 * the next time they are drawn.
 */

import { Image } from 'expo-image';

import { releaseVoice } from '@/services/device-tts/engine';

/**
 * How long waking waits for the voice to finish its sentence. A reader being
 * read to is not kept waiting on it: the voice is then left loaded.
 */
const VOICE_WAIT_MS = 1500;

export async function makeRoomForBrain(): Promise<void> {
  void Image.clearMemoryCache();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const waited = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, VOICE_WAIT_MS);
  });
  try {
    await Promise.race([releaseVoice().catch(() => undefined), waited]);
  } finally {
    clearTimeout(timer);
  }
}
