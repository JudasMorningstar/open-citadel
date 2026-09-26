/**
 * The one native audio player, shared by everything in the app that plays or
 * announces audio.
 *
 * `@rntp/player` can be set up exactly once per process, and two features use
 * it: the reader's read-aloud, which only borrows the media session for its
 * lock-screen card, and podcasts, which play through it. So the setup lives
 * here, once, configured for the heavier user: spoken-word content, the audio
 * focus a real player needs (other apps pause, and so do we for a call), and
 * a native progress tick every few seconds that podcasts save positions from,
 * in the background too.
 */
import TrackPlayer, { type BackgroundEvent } from '@rntp/player';

let ready = false;
let backgroundRegistered = false;
const backgroundHandlers = new Set<(event: BackgroundEvent) => Promise<void>>();

/** Seconds between the native player's progress events while audio is playing. */
export const PROGRESS_TICK_SEC = 5;

/**
 * Sets the player up if it is not already. Returns false where the native
 * module is unavailable, which callers treat as "cannot play here".
 */
export function ensureAudioPlayer(): boolean {
  if (ready) return true;
  try {
    TrackPlayer.setupPlayer({
      contentType: 'speech',
      audioMixing: 'exclusive',
      handleAudioBecomingNoisy: true,
      autoUpdateMetadataFromStream: false,
      progressSync: { intervalSeconds: PROGRESS_TICK_SEC },
      android: { wakeMode: 'network', taskRemovedBehavior: 'continue' },
    });
    ready = true;
  } catch (err) {
    // Already set up natively: a JS reload while audio kept playing, or a
    // second call racing the first. Either way the player is there to use.
    ready = /already/i.test(String(err));
  }
  return ready;
}

/**
 * Android only: the player's events while the app is in the background arrive
 * through a headless task rather than the ordinary listeners. Registered once,
 * at module level before the app renders, fanning out to every feature that
 * asked. iOS delivers background events to the ordinary listeners.
 */
export function registerAudioBackgroundHandler(
  handler: (event: BackgroundEvent) => Promise<void>,
): void {
  backgroundHandlers.add(handler);
  if (process.env.EXPO_OS !== 'android' || backgroundRegistered) return;
  try {
    TrackPlayer.registerBackgroundEventHandler(() => async (event) => {
      await Promise.all([...backgroundHandlers].map((h) => h(event).catch(() => {})));
    });
    backgroundRegistered = true;
  } catch {
    // The native module can fail to load on some devices; audio is then unavailable anyway.
  }
}
