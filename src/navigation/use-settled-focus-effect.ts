import { useFocusEffect } from 'expo-router/react-navigation';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Past the longest close in the app (a side dismiss settles in about 285ms,
 * the drawer a little later), so work that runs on coming back starts after
 * the screen that was on top has finished leaving.
 */
const RETURN_SETTLE_MS = 400;

/**
 * `useFocusEffect`, but run once the screen is back in front and still, not
 * on the frame it regains focus.
 *
 * Focus returns the moment a back gesture or button commits, which is the
 * start of the close animation. A reload fired then (the Library re-reading
 * every book, the Timeline re-reading its entries) answers a few dozen
 * milliseconds later with a re-render of a whole page, in the middle of the
 * slide: the freeze partway through going back. Deferred, the same reload
 * lands after the slide, where nobody sees it.
 *
 * `skipFirst` skips the focus that comes with mounting, for a screen whose
 * first load already happens elsewhere. Cancelled if the screen loses focus
 * again before it runs.
 */
export function useSettledFocusEffect(effect: () => void, { skipFirst = false } = {}): void {
  const focusedBefore = useRef(false);
  // Always the latest callback, without re-subscribing the focus listener.
  const latest = useRef(effect);
  useEffect(() => {
    latest.current = effect;
  });

  useFocusEffect(
    useCallback(() => {
      if (skipFirst && !focusedBefore.current) {
        focusedBefore.current = true;
        return undefined;
      }
      focusedBefore.current = true;
      const timer = setTimeout(() => latest.current(), RETURN_SETTLE_MS);
      return () => clearTimeout(timer);
    }, [skipFirst]),
  );
}
