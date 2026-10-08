import React from "react";
import { useSharedValue, withTiming } from "react-native-reanimated";

import { easing, motion } from "@/constants/theme";
import { GAP, SCAN_GRACE_MS } from "@/utils/pull-to-sync";

/**
 * How far a scan holds the pull-to-sync gap open: fully while one runs, and
 * from the moment a pull asks for one until it reports (or `SCAN_GRACE_MS`
 * passes without it doing so).
 */
export function useScanHold(running: boolean, reduced: boolean) {
  /** What a scan (asked for, running, or both) is holding open. */
  const hold = useSharedValue(0);

  /*
   * A pull has started a scan and is waiting for it to say so.
   *
   * State and not a ref, though a ref is what this wants to be. Two things
   * read it — the effect that decides whether `running: false` means "no scan"
   * or "not yet", and the label, which must not print PULL TO SYNC under a
   * loader that is already going — and one of them renders. A ref would also
   * have to travel into the gesture's `onEnd`, which is built during render,
   * and reading one from there is exactly what refs are not for.
   */
  const [waiting, setWaiting] = React.useState(false);
  /*
   * Cleared the moment the scan it was waiting for arrives, during render
   * rather than in an effect: the answer is knowable from `running` right
   * here, and an effect would commit a frame with both flags true.
   */
  if (waiting && running) setWaiting(false);

  React.useEffect(() => {
    if (running) {
      /*
       * The scan has arrived. If a pull put the gap up already this animates
       * from `GAP` to `GAP` and does nothing, which is the point; if the scan
       * came from somewhere else — the launch scan, the button in All Books —
       * this is what opens it.
       */
      hold.set(
        reduced ? GAP : withTiming(GAP, { duration: motion.base, easing }),
      );
      return;
    }
    // Not running, and a pull is still waiting on the scan it asked for.
    // Closing the gap here is the blink: it is the whole bug.
    if (waiting) return;
    hold.set(reduced ? 0 : withTiming(0, { duration: motion.base, easing }));
  }, [running, waiting, hold, reduced]);

  /*
   * The backstop for a scan that never reports.
   *
   * Mounted with the wait and torn down with it, so a scan that arrives takes
   * the timer with it rather than racing it. Nothing here touches the gap
   * directly: dropping `waiting` is enough, because the effect above is
   * already watching for exactly that.
   */
  React.useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => setWaiting(false), SCAN_GRACE_MS);
    return () => clearTimeout(timer);
  }, [waiting]);

  return { hold, waiting, setWaiting };
}
