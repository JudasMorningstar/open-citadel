import React from "react";
import { Platform } from "react-native";
import {
    useAnimatedReaction,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useReducedMotion,
    useSharedValue,
} from "react-native-reanimated";
// The real export, not a `runOnJS` wrapper: a plain JS helper is a Remote
// Function to the UI runtime, so calling one from a gesture callback throws.
import { scheduleOnRN } from "react-native-worklets";

import { usePullGesture } from "@/hooks/use-pull-gesture";
import { useScanHold } from "@/hooks/use-scan-hold";
import { GAP, resist, TRIGGER } from "@/utils/pull-to-sync";
import { haptics } from "@/utils/haptics";

/**
 * Everything `PullToSync` does: the pull, the gap it opens, and holding that
 * gap open for as long as the scan it started (or any other scan) runs.
 *
 * ## Why the gesture is hand-built
 *
 * iOS uses `RefreshControl` only as the native recognizer, with its spinner
 * transparent. `UIScrollView` otherwise claims the drag while a manual child
 * pan is still waiting to activate, so the custom gesture never reaches its
 * threshold there. Its negative content offset drives this indicator instead.
 *
 * Android has no negative bounce offset, so it uses a pan that runs alongside
 * the scroll view's own gesture and only has an opinion while the shelf is
 * already at the top. That path moves the shelf with a transform. An earlier
 * sketch grew a spacer above the scroller instead, which is a Yoga pass per
 * frame on the app's longest page.
 *
 * ## Why the gap outlives the finger
 *
 * Letting go is not the end of the scan, it is the start of it, so the gap
 * stays open and becomes where the scan reports itself. The height drawn is
 * the larger of what the finger is holding and what the scan is holding, and
 * the release puts the second one up before it takes the first one down, so
 * there is no frame between them (see `SCAN_GRACE_MS`).
 */
export type PullLabels = {
  /** While pulling, before letting go would do anything. */
  idle: string;
  /** Once letting go would start it. */
  armed: string;
};

export function usePullToSync(running: boolean, onSync: () => void, labels: PullLabels) {
  const reduced = useReducedMotion();
  const usesNativeRefresh = Platform.OS === "ios";

  /** How far down the shelf is. The pull only has standing at the very top. */
  const scrollY = useSharedValue(0);
  /** What the finger is holding open. */
  const drag = useSharedValue(0);
  const { hold, waiting, setWaiting } = useScanHold(running, reduced);

  // Composed onto `ScrollFade`'s own handler by `PageFade` — see its `onScroll`
  // note. It has to be an animated handler for that to work.
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.set(event.contentOffset.y);
      if (usesNativeRefresh) {
        drag.set(resist(Math.max(0, -event.contentOffset.y)));
      }
    },
  });

  const handleNativeRefresh = () => {
    hold.set(GAP);
    setWaiting(true);
    onSync();
  };

  /*
   * Whether letting go now would start a scan.
   *
   * A boolean and not the distance, so this crosses to React twice in a pull
   * rather than on every frame of one. The label is the only thing that needs
   * to know, and it has two things to say.
   */
  const [armed, setArmed] = React.useState(false);
  useAnimatedReaction(
    () => drag.get() >= TRIGGER,
    (isArmed, wasArmed) => {
      if (wasArmed === null || isArmed === wasArmed) return;
      scheduleOnRN(setArmed, isArmed);
      // The one moment in the pull worth feeling: it has become a decision.
      // Nothing on the way back down — passing the line the other way is the
      // reader taking something back, not committing to it.
      if (isArmed) scheduleOnRN(haptics.select);
    },
  );

  const pan = usePullGesture({ scrollY, drag, hold, reduced, setWaiting, onSync });

  /*
   * How far open the gap is: whichever of the two is holding it wider.
   *
   * Derived once rather than worked out inside each style below. Both need the
   * same number every frame, and written twice it is also the same DECISION
   * twice — the kind that drifts the moment one of them grows a condition.
   */
  const open = useDerivedValue(() => Math.max(drag.get(), hold.get()));

  const gap = useAnimatedStyle(() => ({
    opacity: Math.min(open.get() / GAP, 1),
    transform: [{ translateY: open.get() }],
  }));

  const content = useAnimatedStyle(() => ({
    // UIRefreshControl owns the iOS inset through the whole scan. Translating
    // this viewport as well would reveal an empty strip along its bottom.
    transform: [{ translateY: usesNativeRefresh ? 0 : open.get() }],
  }));

  /*
   * No label once a scan is on its way, whether or not it has reported itself
   * yet: the indicator says what it is doing, and "PULL TO SYNC" printed
   * under a running loader is the gap contradicting itself.
   */
  const label = running || waiting ? undefined : armed ? labels.armed : labels.idle;

  return {
    usesNativeRefresh,
    onScroll,
    pan,
    gapStyle: gap,
    contentStyle: content,
    refreshing: running || waiting,
    onNativeRefresh: handleNativeRefresh,
    label,
  };
}
