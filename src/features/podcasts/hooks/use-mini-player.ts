import { useRouter } from 'expo-router';
import React from 'react';

import { MINI_PLAYER_GAP, MINI_PLAYER_HEIGHT, type MiniPlayerProps } from '@/features/podcasts/components/mini-player';
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
      onOpen,
      onToggle,
      onSkipForward,
      onClose,
    },
    clearance: MINI_PLAYER_HEIGHT + MINI_PLAYER_GAP,
  };
}
