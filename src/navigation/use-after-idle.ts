import { startTransition, useEffect, useState } from 'react';

import { onIdle } from '@/lib/idle';

/** Once armed, the longest the idle wait itself may run. */
const IDLE_TIMEOUT_MS = 1000;

type AfterIdle = {
  /** What has to have happened before the idle wait starts at all. */
  armed: boolean;
  /** Give up waiting to be armed after this long, and go ahead. */
  capMs: number;
  /** Something needs it this instant (a press, a drag): skip the wait. */
  now?: boolean;
};

/**
 * True once the thing in front has had its turn and the JS thread has gone
 * quiet. For mounting what is not on screen yet: the hub's neighbour pages.
 *
 * `useAfterFirstPaint` is the right gate for the body of the screen being
 * opened, which the user is waiting for. It is the wrong one for something
 * they are NOT waiting for: two frames after the first paint is exactly when
 * the screen in front is reading its data and mounting its content, and a
 * heavy mount started there goes ahead of it in the queue.
 *
 * Latches, and flips inside a Transition, so React keeps yielding to taps and
 * to the screen in front while the deferred tree renders.
 */
export function useAfterIdle({ armed, capMs, now = false }: AfterIdle): boolean {
  const [ready, setReady] = useState(false);
  // State following a prop, set while rendering: once asked for, it stays.
  if (now && !ready) setReady(true);

  useEffect(() => {
    if (ready) return undefined;
    const cap = setTimeout(() => startTransition(() => setReady(true)), capMs);
    return () => clearTimeout(cap);
  }, [capMs, ready]);

  useEffect(() => {
    if (ready || !armed) return undefined;
    return onIdle(() => startTransition(() => setReady(true)), IDLE_TIMEOUT_MS);
  }, [armed, ready]);

  return ready || now;
}
