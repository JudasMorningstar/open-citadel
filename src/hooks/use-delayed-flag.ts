import { useEffect, useState } from 'react';

/**
 * `flag`, but only once it has stayed true for `ms`. For a loader that should
 * appear only when a wait is long enough to notice: a start that takes a
 * blink shows nothing, one that takes a while shows the loader. Drops at once
 * when the flag does.
 */
export function useDelayedFlag(flag: boolean, ms: number): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!flag) return;
    const timer = setTimeout(() => setShown(true), ms);
    return () => {
      clearTimeout(timer);
      setShown(false);
    };
  }, [flag, ms]);
  return flag && shown;
}
