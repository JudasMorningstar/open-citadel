import { startTransition, useEffect, useState } from 'react';

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
 * (a scroll under way, or a sheet being dragged: both share the thread a
 * step's rows are built on). It holds at once: a step already being drawn
 * when the hold begins is kept off the screen until the hold lifts.
 *
 * `until` stops the steps once that many are drawn, for a list that should
 * not fill itself in before anybody has asked for the rest. Leave it out, or
 * raise it, and the steps go on.
 */
export function useStagedCount(total: number, first: number, step: number, hold = false, until?: number): number {
  const painted = useAfterFirstPaint();
  const [count, setCount] = useState(first);
  const [whole, setWhole] = useState(total <= first);
  // State following the count, set while rendering: once reached, it stays.
  if (!whole && count >= total) setWhole(true);
  useEffect(() => {
    if (whole || !painted || hold || (until !== undefined && count >= until)) return undefined;
    // A transition, so a step being drawn can be set aside. Drawn as an
    // ordinary update it could not be: a hold that began while React was in
    // the middle of a step waited for the step, and the step then landed
    // under the very thing the hold was for.
    return onIdle(() => startTransition(() => setCount((drawn) => drawn + step)), IDLE_TIMEOUT_MS);
  }, [whole, painted, hold, until, count, step]);
  const reached = whole ? total : Math.min(count, total);

  // While held, the answer is the one given when the hold began. The render
  // that starts a hold is urgent and does not see a step still in transition,
  // so `reached` here is what is on screen; the step is finished behind the
  // hold and shows when it lifts. State following a prop, set while rendering.
  const [heldAt, setHeldAt] = useState<number | null>(hold ? reached : null);
  if (hold && heldAt === null) setHeldAt(reached);
  if (!hold && heldAt !== null) setHeldAt(null);

  return hold && heldAt !== null ? heldAt : reached;
}
