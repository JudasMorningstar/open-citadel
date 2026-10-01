/**
 * The phone's own text-to-speech (`expo-speech`), the "native" reading voice.
 * Shared by the voice picker and the AI voice preview's fallback.
 */

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
