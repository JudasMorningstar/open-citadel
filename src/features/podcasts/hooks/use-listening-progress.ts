import { useIsFocused } from 'expo-router';
import { useDerivedValue } from 'react-native-reanimated';

import { usePlaybackClock } from '@/features/podcasts/hooks/use-playback-clock';

/**
 * How far through the episode in the player the listener is, 0..1, on the UI
 * thread: the mini player's hairline, and the Continue Listening card of the
 * episode playing.
 *
 * Polls the player only while its screen is in front. Every screen in the
 * stack stays mounted, so four screens deep there are four mini players, and
 * only the top one is seen. Read in the bar's own component, so a change of
 * focus re-renders the bar and not the page around it.
 */
export function useListeningProgress(fallbackPosition: number, fallbackDuration: number) {
  const focused = useIsFocused();
  const clock = usePlaybackClock(fallbackPosition, fallbackDuration, focused);
  return useDerivedValue(() => {
    const duration = clock.duration.get();
    return duration > 0 ? Math.min(1, clock.position.get() / duration) : 0;
  });
}
