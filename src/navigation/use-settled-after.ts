import { useEffect, useState } from 'react';

/**
 * True `ms` after mount, and from then on. For content that mounts inside
 * something with no screen transition of its own to read, like a side of the
 * Library appearing through the switch's fade.
 *
 * Zero means nothing is moving (the side the app opened on), and is settled
 * from the first render: a timer there is only a wait, and one that cannot
 * fire until the launch's other work lets go of the thread.
 */
export function useSettledAfter(ms: number): boolean {
  const [settled, setSettled] = useState(ms <= 0);
  useEffect(() => {
    if (ms <= 0) return undefined;
    const timer = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return settled;
}
