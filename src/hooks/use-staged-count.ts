import { useEffect, useState } from 'react';

import { onIdle } from '@/lib/idle';
import { useAfterFirstPaint } from '@/navigation/use-after-first-paint';

/** How long a step waits for a quiet moment before it is taken anyway. */
const IDLE_TIMEOUT_MS = 300;

/**
 * How many of a long list's rows to draw: a first screenful at once, then a
 * step more each time the thread is idle, until all of them are.
 *
 * For a list in a plain scroll view, which draws every row it is given. In
 * steps rather than one transition for the rest: the rest in one go held the
 * thread for as long as the whole list had, and the placeholder stayed up
 * over rows that were already there. A step is short enough to sit between
 * two taps. Once the end is reached it stays reached, so a list that grows
 * afterwards (a language opened) is drawn whole.
 *
 * `hold` stops the steps while it is true, for a caller with a reason to wait
 * (a scroll under way, which shares the thread a step's rows are built on).
 */
export function useStagedCount(total: number, first: number, step: number, hold = false): number {
  const painted = useAfterFirstPaint();
  const [count, setCount] = useState(first);
  const [whole, setWhole] = useState(total <= first);
  // State following the count, set while rendering: once reached, it stays.
  if (!whole && count >= total) setWhole(true);

  useEffect(() => {
    if (whole || !painted || hold) return undefined;
    return onIdle(() => setCount((drawn) => drawn + step), IDLE_TIMEOUT_MS);
  }, [whole, painted, hold, count, step]);

  return whole ? total : Math.min(count, total);
}
