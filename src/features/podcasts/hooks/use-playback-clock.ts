import TrackPlayer from '@rntp/player';
import React from 'react';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { heldPosition } from '@/utils/seek-hold';
import { usePodcastPlayer } from '@/stores/podcast-player';

/**
 * The player's reported position, or a seek's target while the player is
 * still catching up to it, so a scrub never snaps back to where it started.
 * Drops the hold once the player has arrived.
 */
function settledPosition(reported: number): number {
  const { seekHold, patch } = usePodcastPlayer.getState();
  const { position, released } = heldPosition(reported, seekHold, Date.now());
  if (released) patch({ seekHold: null });
  return position;
}

/** How often the player is asked where it is. */
const POLL_MS = 500;

export type PlaybackClock = {
  /** Seconds, animated linearly between polls so a bar glides rather than steps. */
  position: SharedValue<number>;
  duration: SharedValue<number>;
};

/**
 * Where the player is, as shared values, for the bars that draw it.
 *
 * Polled rather than pushed: the native progress event only comes every few
 * seconds (it is for saving, not drawing). Each poll animates the value to
 * where the audio will be by the next one, so the fill moves continuously on
 * the UI thread and React never renders for it. Stops polling when nothing is
 * loaded, and when the surface drawing it unmounts.
 *
 * An episode restored after a restart, not yet loaded, shows where it was
 * left (`fallbackPosition`) rather than zero.
 */
export function usePlaybackClock(fallbackPosition: number, fallbackDuration: number, active = true): PlaybackClock {
  const loaded = usePodcastPlayer((s) => s.loaded);
  const isPlaying = usePodcastPlayer((s) => s.isPlaying);
  const speed = usePodcastPlayer((s) => s.speed);
  const position = useSharedValue(fallbackPosition);
  const duration = useSharedValue(fallbackDuration);

  React.useEffect(() => {
    if (!loaded) {
      position.set(fallbackPosition);
      duration.set(fallbackDuration);
      return;
    }
    const read = (animate: boolean) => {
      const progress = TrackPlayer.getProgress();
      if (progress.duration > 0) duration.set(progress.duration);
      const reported = settledPosition(progress.position);
      const ahead = animate ? reported + (POLL_MS / 1000) * speed : reported;
      position.set(animate ? withTiming(ahead, { duration: POLL_MS, easing: Easing.linear }) : ahead);
    };
    read(false);
    // Nothing to draw for (a mini player on a screen that is covered): one
    // read so it is right when it shows again, and no polling meanwhile.
    if (!active) return;
    // Polled while paused too (a sync read, so it costs next to nothing): a
    // skip or a chapter jump made while paused has to move the bar as well.
    const id = setInterval(() => read(isPlaying), POLL_MS);
    return () => clearInterval(id);
  }, [active, duration, fallbackDuration, fallbackPosition, isPlaying, loaded, position, speed]);

  return { position, duration };
}

/**
 * The same position as whole seconds in React state, for the chapter the
 * player shows. It only re-renders when the whole second changes.
 */
export function usePlaybackSeconds(fallbackPosition: number): { position: number; duration: number } {
  const loaded = usePodcastPlayer((s) => s.loaded);
  const isPlaying = usePodcastPlayer((s) => s.isPlaying);
  const [state, setState] = React.useState({ position: fallbackPosition, duration: 0 });

  React.useEffect(() => {
    if (!loaded) return;
    const read = () => {
      const p = TrackPlayer.getProgress();
      const position = settledPosition(p.position);
      setState((prev) =>
        Math.floor(prev.position) === Math.floor(position) && prev.duration === p.duration
          ? prev
          : { position, duration: p.duration },
      );
    };
    const first = setTimeout(read, 0);
    // Paused too, so a skip made while paused shows in the times.
    const id = setInterval(read, isPlaying ? 1000 : 500);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [isPlaying, loaded]);

  return loaded ? state : { position: fallbackPosition, duration: 0 };
}
