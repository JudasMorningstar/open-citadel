/**
 * The player's in-memory state for this JS runtime: which episode is being
 * tracked for progress, and which ones were let go of on purpose.
 */
import TrackPlayer, { PlaybackState } from "@rntp/player";

import { PROGRESS_TICK_SEC } from "@/services/audio-session";
import { deleteIfPlayed } from "@/services/podcasts/downloads";
import { saveProgress, setPlayed } from "@/services/podcasts/episode-state";
import { usePodcastPlayer } from "@/stores/podcast-player";
import { invalidatePodcastLibrary } from "@/query-manager/podcasts/invalidate";

/** Closer to the end than this counts as finished, as in AntennaPod's "smart mark as played". */
const FINISHED_WITHIN_SEC = 30;

export type Tracking = {
  episodeId: string;
  podcastId: string;
  lastPosition: number;
  lastDuration: number;
  lastTickAt: number;
  skipEndingSec: number;
};

export const session = {
  tracking: null as Tracking | null,
  listenersAttached: false,
  /**
   * Episodes this session let go of on purpose: finished, stopped, or handed
   * over to read-aloud. The native player sends one last progress tick when
   * audio stops, which can land after the letting go, and must not be taken
   * up again (see `adopt`): that would write a position back onto a played
   * episode or pull the player back from read-aloud.
   */
  letGo: new Set<string>(),
};

export function store() {
  return usePodcastPlayer.getState();
}

/** Longest the loader shows for a play that never reports back, so it cannot spin for ever. */
const STARTING_TIMEOUT_MS = 15_000;
let startingTimer: ReturnType<typeof setTimeout> | null = null;

/** Play was asked for: the controls show their loader until the audio sounds (see `events`). */
export function markStarting(): void {
  store().patch({ starting: true });
  if (startingTimer) clearTimeout(startingTimer);
  startingTimer = setTimeout(() => {
    startingTimer = null;
    if (store().starting) store().patch({ starting: false });
  }, STARTING_TIMEOUT_MS);
}

/** The audio sounded, stopped or failed: whatever play was waiting for is over. */
export function clearStarting(): void {
  if (startingTimer) clearTimeout(startingTimer);
  startingTimer = null;
  if (store().starting) store().patch({ starting: false });
}

/** How often a seek is checked on. */
const SEEK_POLL_MS = 150;
/**
 * Before the first check: the player reports a seek's buffering a moment
 * after it is sent, so "ready" read sooner is still the place it left.
 */
const SEEK_SETTLE_MS = 250;
let seekTimer: ReturnType<typeof setInterval> | null = null;

/**
 * A seek was sent: the controls show their loader until the player is ready
 * at the new place. Polled rather than taken from the state events, because a
 * seek inside what is already buffered can be over before the player reports
 * any change at all, and then no event would ever end the wait.
 *
 * Once ready, a seek made while playing is playing again: if the native
 * player never reported the dip, `starting` is cleared here instead of by
 * its event.
 */
export function markSeeking(): void {
  store().patch({ seeking: true });
  if (seekTimer) clearInterval(seekTimer);
  const sentAt = Date.now();
  seekTimer = setInterval(() => {
    const waited = Date.now() - sentAt;
    if (waited < SEEK_SETTLE_MS) return;
    const state = TrackPlayer.getPlaybackState();
    if (state === PlaybackState.Buffering && waited < STARTING_TIMEOUT_MS) return;
    clearSeeking();
    if (state === PlaybackState.Ready && TrackPlayer.isPlaying()) {
      store().patch({ isPlaying: true });
      clearStarting();
    } else {
      void settlePausedSeek();
    }
  }, SEEK_POLL_MS);
}

/**
 * Paused, no progress tick will save the new place, so it is saved here, and
 * the lists re-read: the Continue Listening card's "left" says where the
 * listener now is rather than where they last paused.
 */
async function settlePausedSeek(): Promise<void> {
  await persistProgress();
  invalidatePodcastLibrary();
}

/** The seek arrived, failed, or the player let go: nothing is waiting on it any more. */
export function clearSeeking(): void {
  if (seekTimer) clearInterval(seekTimer);
  seekTimer = null;
  if (store().seeking) store().patch({ seeking: false });
}

/** Starts tracking an episode's progress from `position`. */
export function track(
  episode: { id: string; podcastId: string; durationSec: number },
  position: number,
  skipEndingSec = 0,
): Tracking {
  session.tracking = {
    episodeId: episode.id,
    podcastId: episode.podcastId,
    lastPosition: position,
    lastDuration: episode.durationSec,
    lastTickAt: Date.now(),
    skipEndingSec,
  };
  return session.tracking;
}

/** Saves the current position now, counting only time plausibly spent listening. */
export async function persistProgress(position?: number, duration?: number): Promise<void> {
  const tracking = session.tracking;
  if (!tracking || !store().loaded) return;
  const progress = position === undefined ? TrackPlayer.getProgress() : { position, duration: duration ?? 0 };
  const now = Date.now();
  const moved = progress.position - tracking.lastPosition;
  const allowed = ((now - tracking.lastTickAt) / 1000) * Math.max(store().speed, 1) + 2;
  const listened = moved > 0 && moved <= allowed ? moved : 0;
  tracking.lastPosition = progress.position;
  tracking.lastTickAt = now;
  if (progress.duration > 0) tracking.lastDuration = progress.duration;
  await saveProgress({ id: tracking.episodeId, podcastId: tracking.podcastId }, progress.position, listened);
}

/** Marks an episode played (and lets go of it), deleting its download if the settings say to. */
export async function finishEpisode(episodeId: string): Promise<void> {
  session.letGo.add(episodeId);
  await setPlayed([episodeId], true);
  await deleteIfPlayed(episodeId);
  invalidatePodcastLibrary();
}

/** Whether a tracked episode got close enough to its end to count as finished. */
export function ranToTheEnd(t: Tracking): boolean {
  if (t.lastDuration <= 0) return false;
  const margin = Math.max(FINISHED_WITHIN_SEC, t.skipEndingSec, PROGRESS_TICK_SEC + 1);
  return t.lastPosition >= t.lastDuration - margin;
}
