import React from 'react';

/**
 * How long a scroller has to have stopped before it counts as at rest. Swipes
 * come in runs, and whatever was waiting for rest (tiles being built) would
 * otherwise start in the gap between two and land in the middle of the next.
 */
const REST_MS = 400;

/**
 * Tells `onChange` when a scroller starts moving and when it comes to rest.
 *
 * Moving is a drag or the fling after it, told by the scroller's own begin and
 * end events rather than by its offsets: twice a gesture, not once a frame.
 * Spread the handlers onto the scroller.
 */
export function useScrollMotion(onChange: (moving: boolean) => void) {
  const rest = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRest = React.useCallback(() => {
    if (rest.current) clearTimeout(rest.current);
    rest.current = null;
  }, []);
  React.useEffect(() => cancelRest, [cancelRest]);

  return React.useMemo(
    () => ({
      onScrollBeginDrag: () => {
        cancelRest();
        onChange(true);
      },
      // A fling, if there is one, begins before this fires and cancels it.
      onScrollEndDrag: () => {
        cancelRest();
        rest.current = setTimeout(() => onChange(false), REST_MS);
      },
      onMomentumScrollBegin: cancelRest,
      onMomentumScrollEnd: () => {
        cancelRest();
        rest.current = setTimeout(() => onChange(false), REST_MS);
      },
    }),
    [cancelRest, onChange],
  );
}
