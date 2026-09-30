/**
 * The native player's events, in the foreground and (on Android) from the
 * background task: saving progress, finishing and moving on, and catching up
 * with transitions the lock screen or a headset made without the app.
 */
import TrackPlayer, { Event, PlaybackState, type BackgroundEvent, type MediaItem } from "@rntp/player";

import { ensureAudioPlayer, registerAudioBackgroundHandler } from "@/services/audio-session";
import { getEpisodeItem } from "@/services/podcasts/episodes";
import { advance, becomeCurrent, syncNativeQueue } from "@/services/podcasts/player/lifecycle";
import { nowPlayingFrom, speedFor } from "@/services/podcasts/player/media";
import {
  clearSeeking,
  clearStarting,
  finishEpisode,
  persistProgress,
  ranToTheEnd,
  session,
  store,
  track,
} from "@/services/podcasts/player/session";
import { getShow } from "@/services/podcasts/shows";
import { podcastPrefs, usePodcastPrefs } from "@/stores/podcast-prefs";
import { invalidatePodcastLibrary } from "@/query-manager/podcasts/invalidate";

/** Past the artwork's step back on pause (`motion.slow`), with room to spare. */
const PAUSE_SETTLE_MS = 450;

async function onTransition(item: MediaItem | null): Promise<void> {
  const previous = session.tracking;
  if (!item?.mediaId || item.mediaId === previous?.episodeId) return;
  if (previous) {
    if (ranToTheEnd(previous)) await finishEpisode(previous.episodeId);
    session.tracking = null;
  }
  const next = await getEpisodeItem(item.mediaId);
  if (!next) return;
  await becomeCurrent(next, null);
  // Keep the native queue topped up from Up Next as it is consumed.
  await syncNativeQueue();
}

/**
 * Takes up an episode the native player is playing that this runtime is not
 * tracking: on Android the JS runtime can be started fresh by a background
 * event while audio carried on, with every in-memory value gone. Without this
 * its position would silently stop being saved.
 */
async function adopt(mediaId: string): Promise<boolean> {
  if (session.letGo.has(mediaId)) return false;
  const item = await getEpisodeItem(mediaId);
  if (!item || item.playState === "played") return false;
  const show = await getShow(item.podcastId);
  track(item, item.positionSec, show?.skipEndingSec ?? 0);
  store().patch({ current: nowPlayingFrom(item), loaded: true });
  return true;
}

/** Finishes the tracked episode and moves on. Lets go first, so no later tick writes a position back onto it. */
async function finishTrackedAndAdvance(episodeId: string): Promise<void> {
  session.tracking = null;
  await finishEpisode(episodeId);
  await advance();
}

async function handleEvent(event: BackgroundEvent): Promise<void> {
  switch (event.type) {
    case Event.PlaybackProgressUpdated: {
      if (!session.tracking) {
        if (!(await adopt(event.mediaId))) return;
      } else if (session.tracking.episodeId !== event.mediaId) {
        return;
      }
      await persistProgress(event.position, event.duration);
      // Skip the ending: the rest of this episode is outro the listener asked not to hear.
      const t = session.tracking;
      if (t && t.skipEndingSec > 0 && event.duration > 0 && event.duration - event.position <= t.skipEndingSec) {
        await finishTrackedAndAdvance(t.episodeId);
      }
      return;
    }
    case Event.IsPlayingChanged: {
      store().patch({ isPlaying: event.playing });
      if (event.playing) clearStarting();
      if (!event.playing) {
        await persistProgress();
        // After the pause has finished animating (the player's artwork steps
        // back over `motion.slow`): every podcast list re-reads on this, and
        // those re-renders landing inside the animation made it jump.
        setTimeout(invalidatePodcastLibrary, PAUSE_SETTLE_MS);
      } else if (session.tracking) {
        session.tracking.lastTickAt = Date.now();
      }
      return;
    }
    case Event.PlaybackStateChanged: {
      store().patch({ isBuffering: event.state === PlaybackState.Buffering });
      if (event.state === PlaybackState.Error || event.state === PlaybackState.Ended || event.state === PlaybackState.Idle) {
        clearStarting();
      }
      if (event.state === PlaybackState.Ended && session.tracking) {
        await finishTrackedAndAdvance(session.tracking.episodeId);
      }
      return;
    }
    case Event.MediaItemTransition:
      await onTransition(event.item);
      return;
    case Event.PlaybackError:
      clearStarting();
      clearSeeking();
      store().patch({ error: "This episode could not be played. Check your connection, or download it first." });
      return;
    default:
      return;
  }
}

const FOREGROUND_EVENTS = [
  Event.PlaybackProgressUpdated,
  Event.IsPlayingChanged,
  Event.PlaybackStateChanged,
  Event.MediaItemTransition,
  Event.PlaybackError,
] as const;

/**
 * The listeners attached by this runtime, kept outside the module. A hot
 * reload in development runs this module again with a fresh `session`, and
 * the old copy's listeners stayed attached, still holding the episode they
 * were tracking before the reload. Closing the player empties the native
 * queue, which reports "ended", and an old copy took that as the episode
 * finishing: it was marked played and dropped out of Continue Listening.
 * Removing the previous set first leaves one copy listening.
 */
const attached = globalThis as { __podcastPlayerListeners?: { remove: () => void }[] };

/** Listens to the native player in the foreground. Once per runtime. */
export function attachListeners(): void {
  if (session.listenersAttached) return;
  session.listenersAttached = true;
  attached.__podcastPlayerListeners?.forEach((listener) => listener.remove());
  attached.__podcastPlayerListeners = [
    ...FOREGROUND_EVENTS.map((type) =>
      TrackPlayer.addEventListener(type, ((payload: object) =>
        void handleEvent({ ...payload, type } as BackgroundEvent)) as never),
    ),
    // Its own listener: this event's payload has a `type` field of its own, so it
    // cannot travel through the shared handler's `{ ...payload, type }` shape.
    // It only clears what the screens show, which nothing in the background draws.
    TrackPlayer.addEventListener(Event.SleepTimerTriggered, () => store().patch({ sleep: null })),
  ];
}

/** Android: the same handling while the app is in the background. Module level, before render. */
export function registerPodcastBackgroundHandler(): void {
  registerAudioBackgroundHandler(handleEvent);
}

/**
 * Puts the last episode back in the mini player after a restart, paused and
 * not yet loaded (loading is deferred to the first press, so launch pays
 * nothing for it). If the native player is in fact still playing it (the app
 * was reloaded while audio carried on), takes it back up as it is.
 */
export async function restoreNowPlaying(): Promise<void> {
  const episodeId = podcastPrefs().nowPlayingEpisodeId;
  if (!episodeId) return;
  const item = await getEpisodeItem(episodeId);
  if (!item) {
    usePodcastPrefs.getState().set("nowPlayingEpisodeId", null);
    return;
  }
  // Android only: the player is set up at launch there (for read-aloud), so it
  // can be asked what it holds. On iOS it is set up on first play, and asking
  // an unset player is not safe.
  let active: MediaItem | null = null;
  if (process.env.EXPO_OS === "android") {
    try {
      active = TrackPlayer.getActiveMediaItem();
    } catch {
      active = null;
    }
  }
  if (active?.mediaId === item.id && ensureAudioPlayer()) {
    attachListeners();
    track(item, TrackPlayer.getProgress().position);
    store().patch({
      current: nowPlayingFrom(item),
      loaded: true,
      isPlaying: TrackPlayer.isPlaying(),
      speed: await speedFor(item.podcastId),
    });
    return;
  }
  store().patch({ current: nowPlayingFrom(item), loaded: false, speed: await speedFor(item.podcastId) });
}
