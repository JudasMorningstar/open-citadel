import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMiniPlayerClearance } from '@/features/podcasts/hooks/use-mini-player';

/**
 * How far above a screen's bottom edge its floating button is lifted, on
 * every screen alike: clear of the home indicator, and of the mini player's
 * room whenever something is in the player.
 *
 * The same on the screens that do not draw the mini player too. The Timeline
 * does not, and its button sat a mini player's height below the Library's, so
 * it jumped on every swipe between them. One answer for all of them is what
 * keeps the button still.
 */
export function useFabBottom(): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + useMiniPlayerClearance();
}
