import { useEffect, useState } from 'react';
import { useAnimatedReaction } from 'react-native-reanimated';
import { useScreenAnimation } from 'react-native-screen-transitions';
import { scheduleOnRN } from 'react-native-worklets';

/**
 * A backstop for a screen that never animates in (a deep link, the first
 * screen of the app), so its content is never held back for good.
 */
const FALLBACK_MS = 700;

/**
 * True the moment this screen's entrance has visually finished, and true from
 * then on.
 *
 * Read from the transition itself (`settled` on the screen's own animation
 * state, on the UI thread) rather than a timer guessing how long it takes. A
 * timer has to guess long to be safe, which leaves a skeleton on screen after
 * the page has stopped moving; guess short and the content lands mid-slide,
 * which is what makes a transition stagger. This flips when the slide is done
 * and not before.
 *
 * Latched: `useScreenSettled` goes false again when a screen loses focus,
 * which is right for work that should pause off stage but wrong for a
 * `Handover` around a page's body, which would unmount the list underneath
 * whenever a screen was pushed on top and lose the reader's place.
 */
export function useSettledOnce(): boolean {
  const animation = useScreenAnimation();
  const [landed, setLanded] = useState(false);

  useAnimatedReaction(
    () => {
      const current = animation.get().current;
      return current.settled === 1 && current.closing === 0 && current.progress >= 0.99;
    },
    (done, was) => {
      if (done && !was) scheduleOnRN(setLanded, true);
    },
  );

  useEffect(() => {
    if (landed) return;
    const timer = setTimeout(() => setLanded(true), FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [landed]);

  return landed;
}
