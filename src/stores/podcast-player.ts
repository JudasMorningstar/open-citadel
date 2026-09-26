import { create } from 'zustand';

import { useDelayedFlag } from '@/hooks/use-delayed-flag';
import type { SeekHold } from '@/utils/seek-hold';

/** What the mini player and the full player draw. Snapshotted when an episode loads. */
export type NowPlaying = {
  episodeId: string;
  podcastId: string;
  title: string;
  showTitle: string;
  artworkUrl: string | null;
  durationSec: number;
  /**
   * Where it was when it last left the native player (or was restored after a
   * restart). What the bars show while it is not loaded; the live position
   * comes from the player itself.
   */
  positionSec: number;
};

export type SleepTimer = { kind: 'time'; endsAt: number; minutes: number } | { kind: 'episode' } | null;

/**
 * The podcast player as the screens see it.
 *
 * The playing position is deliberately not here. It changes every frame the
 * audio moves, and the two surfaces that draw it read it from the player
 * directly (`usePlaybackPosition`), so nothing else re-renders as it ticks.
 */
type PodcastPlayerState = {
  current: NowPlaying | null;
  /** The episode is in the native player. False for one restored after a restart until play is pressed. */
  loaded: boolean;
  isPlaying: boolean;
  isBuffering: boolean;
  /**
   * Play was pressed and the audio has not started yet (loading, seeking,
   * buffering). Set on the press, so the control answers the finger at once
   * instead of when the native player reports back.
   */
  starting: boolean;
  /**
   * The last seek, until the native player has caught up with it. Read by the
   * position polls, never rendered, so nothing subscribes to it.
   */
  seekHold: SeekHold;
  speed: number;
  sleep: SleepTimer;
  error: string | null;
  patch: (next: Partial<Omit<PodcastPlayerState, 'patch'>>) => void;
};

export const usePodcastPlayer = create<PodcastPlayerState>((set) => ({
  current: null,
  loaded: false,
  isPlaying: false,
  isBuffering: false,
  starting: false,
  seekHold: null,
  speed: 1,
  sleep: null,
  error: null,
  patch: (next) => set(next),
}));

/** Playing, or about to be: what a play control's icon and the artwork's size follow. */
export const selectPlaying = (s: PodcastPlayerState) => s.isPlaying || s.starting;
/** Waiting on the audio (starting, or buffering while playing): what shows a loader in the control. */
export const selectBusy = (s: PodcastPlayerState) => s.starting || (s.isBuffering && s.isPlaying);

/** Whether this episode is the one in the player, and whether it is sounding. */
export function useEpisodePlayback(episodeId: string): 'playing' | 'paused' | 'idle' {
  return usePodcastPlayer((s) =>
    s.current?.episodeId !== episodeId ? 'idle' : selectPlaying(s) ? 'playing' : 'paused',
  );
}

/**
 * How long a wait has to last before a play control swaps its icon for a
 * loader. The press already flips the icon at once, so a start that takes a
 * blink shows nothing extra; only a real wait (a seek into unbuffered audio,
 * a slow connection) shows the loader.
 */
const LOADER_DELAY_MS = 300;

/** Whether the player's controls should show their loader: waiting, for longer than a blink. */
export function usePlayerLoader(): boolean {
  return useDelayedFlag(usePodcastPlayer(selectBusy), LOADER_DELAY_MS);
}

/** The same, for one episode's own play control: only while it is the one in the player. */
export function useEpisodeBuffering(episodeId: string): boolean {
  const busy = usePodcastPlayer((s) => selectBusy(s) && s.current?.episodeId === episodeId);
  return useDelayedFlag(busy, LOADER_DELAY_MS);
}
