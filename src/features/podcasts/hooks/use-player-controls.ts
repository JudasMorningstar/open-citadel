import { useRouter } from 'expo-router';
import React from 'react';

import type { SleepChoice } from '@/features/podcasts/utils/setting-choices';
import type { usePlayerScreen } from '@/features/podcasts/hooks/use-player-screen';
import * as actions from '@/services/podcasts/actions';
import { playEpisode, seekTo, setSleepTimer, setSpeed, skipBy, togglePlayback } from '@/services/podcasts/player';

type PlayerScreen = ReturnType<typeof usePlayerScreen>;
export type PlayerSheet = 'speed' | 'sleep' | 'upnext' | 'chapters';

/**
 * What the full player's controls do, and which of its sheets is open. Also
 * takes the player back down once the last episode finishes, since there is
 * nothing left to show.
 */
export function usePlayerControls(player: PlayerScreen) {
  const router = useRouter();
  const [sheet, setSheet] = React.useState<PlayerSheet | null>(null);
  const { current, episode, sleep, skipBackSec, skipForwardSec } = player;

  const hasEpisode = current !== null;
  React.useEffect(() => {
    if (!hasEpisode && router.canGoBack()) router.back();
  }, [hasEpisode, router]);

  const favorite = episode?.isFavorite === 1;
  const sleepChoice: SleepChoice = sleep?.kind === 'episode' ? 'episode' : sleep?.kind === 'time' ? sleep.minutes : 'off';
  const closeSheet = React.useCallback(() => setSheet(null), []);

  return {
    sheet,
    open: (next: PlayerSheet) => () => setSheet(next),
    closeSheet,
    favorite,
    sleepChoice,
    close: () => router.back(),
    openShow: () => current && router.push({ pathname: '/podcasts/show/[id]', params: { id: current.podcastId } }),
    toggleFavorite: () => current && void actions.setFavorite([current.episodeId], !favorite),
    toggle: () => void togglePlayback(),
    back: () => skipBy(-skipBackSec),
    forward: () => skipBy(skipForwardSec),
    seek: seekTo,
    setSpeed: (speed: number) => void setSpeed(speed),
    setSleep: (choice: SleepChoice) => setSleepTimer(choice === 'off' ? null : choice),
    upNext: {
      play: (id: string) => {
        closeSheet();
        void playEpisode(id);
      },
      move: (id: string, index: number) => void actions.moveInQueue(id, index),
      remove: (id: string) => void actions.removeFromQueue([id]),
      clear: () => void actions.clearQueue(),
    },
  };
}

export type PlayerControls = ReturnType<typeof usePlayerControls>;
