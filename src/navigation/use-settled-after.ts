import { useEffect, useState } from 'react';

/**
 * True `ms` after mount, and from then on. For content that mounts inside
 * something with no screen transition of its own to read, like a side of the
 * Library appearing through the switch's fade.
 */
export function useSettledAfter(ms: number): boolean {
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(true), ms);
    return () => clearTimeout(timer);
  }, [ms]);
  return settled;
}
