import { useIsFocused } from 'expo-router';
import { useDerivedValue } from 'react-native-reanimated';

import { usePlaybackClock } from '@/features/podcasts/hooks/use-playback-clock';

/**
 * The mini player's listening progress, 0..1, on the UI thread.
 *
 * Polls the player only while its screen is in front. Every screen in the
 * stack stays mounted, so four screens deep there are four mini players, and
 * only the top one is seen. Read here, in the hairline's own component, so a
 * change of focus re-renders the hairline and not the page around it.
 */
export function useMiniPlayerProgress(fallbackPosition: number, fallbackDuration: number) {
  const focused = useIsFocused();
  const clock = usePlaybackClock(fallbackPosition, fallbackDuration, focused);
  return useDerivedValue(() => {
    const duration = clock.duration.get();
    return duration > 0 ? Math.min(1, clock.position.get() / duration) : 0;
  });
}
