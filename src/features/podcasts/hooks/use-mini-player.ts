import { useRouter } from 'expo-router';
import React from 'react';

import { MINI_PLAYER_CLEARANCE, type MiniPlayerProps } from '@/features/podcasts/components/mini-player';
import { skipBy, stopPlayback, togglePlayback } from '@/services/podcasts/player';
import { selectPlaying, usePlayerLoader, usePodcastPlayer } from '@/stores/podcast-player';
import { usePodcastPrefs } from '@/stores/podcast-prefs';

/**
 * Everything the mini player needs, or null when nothing is in the player.
 * Also says how much room to keep free under a screen's content for it.
 */
export function useMiniPlayer(bottomInset: number): { props: MiniPlayerProps | null; clearance: number } {
  const router = useRouter();
  const nowPlaying = usePodcastPlayer((s) => s.current);
  // Playing or about to be: set on the press, so the icon answers at once. The
  // loader only for a wait long enough to notice.
  const isPlaying = usePodcastPlayer(selectPlaying);
  const isBuffering = usePlayerLoader();
  const skipForwardSec = usePodcastPrefs((s) => s.skipForwardSec);
  // Already playing when this screen opened: the card came with the screen,
  // so it is simply there. Once it has gone, the next one arrives.
  const [cameWithScreen, setCameWithScreen] = React.useState(nowPlaying !== null);
  if (cameWithScreen && !nowPlaying) setCameWithScreen(false);

  const onOpen = React.useCallback(() => router.push('/podcasts/player'), [router]);
  const onToggle = React.useCallback(() => void togglePlayback(), []);
  const onSkipForward = React.useCallback(() => skipBy(skipForwardSec), [skipForwardSec]);
  const onClose = React.useCallback(() => void stopPlayback(), []);

  if (!nowPlaying) return { props: null, clearance: 0 };
  return {
    props: {
      nowPlaying,
      isPlaying,
      isBuffering,
      skipForwardSec,
      bottomInset,
      arrives: !cameWithScreen,
      onOpen,
      onToggle,
      onSkipForward,
      onClose,
    },
    clearance: MINI_PLAYER_CLEARANCE,
  };
}

/**
 * The mini player's room, whether or not this screen draws it: the full
 * clearance while anything is in the player, nothing otherwise. For what has
 * to sit in the same place on every screen, like the floating buttons.
 */
export function useMiniPlayerClearance(): number {
  return usePodcastPlayer((s) => (s.current ? MINI_PLAYER_CLEARANCE : 0));
}
