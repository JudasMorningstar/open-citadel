import { Gesture } from "react-native-gesture-handler";
import { useSharedValue, withTiming, type SharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { easing, motion } from "@/constants/theme";
import { ACTIVATE, GAP, resist, SLOP, TRIGGER } from "@/utils/pull-to-sync";

type PullGestureOptions = {
  /** How far down the shelf is. The pull only has standing at the very top. */
  scrollY: SharedValue<number>;
  /** What the finger is holding open. */
  drag: SharedValue<number>;
  /** What a scan is holding open. */
  hold: SharedValue<number>;
  reduced: boolean;
  /** Off, the pan never claims a touch and the scroller keeps every drag. */
  enabled: boolean;
  setWaiting: (waiting: boolean) => void;
  onSync: () => void;
};

/** The Android pull: a pan that only claims a downward drag from the very top of the shelf. */
export function usePullGesture({ scrollY, drag, hold, reduced, enabled, setWaiting, onSync }: PullGestureOptions) {
  /*
   * Android is claimed by hand, rather than by declaring a truce with the
   * scroll view. iOS bypasses this gesture entirely; see the component note.
   *
   * The obvious version is `simultaneousWithExternalGesture(scrollRef)`, and
   * it does not work here: `PageFade` clones its child onto an animated
   * component of its own, so a ref put on the `ScrollView` lands on the
   * wrapper and gesture-handler never finds a handler to be simultaneous
   * WITH. There is no truce, the pan wins every downward drag, and the page
   * cannot be scrolled back up — which is exactly what it did.
   *
   * `manualActivation` needs no ref and no arbitration. The gesture sits in
   * BEGAN, blocking nothing, until the two things that make a drag ours are
   * both true: the shelf is at the very top, and the finger is heading down.
   * Anything else fails it outright and the scroll view keeps the touch.
   */
  const startY = useSharedValue(0);
  const startX = useSharedValue(0);
  /** Whether this touch has already been claimed. See the guard below. */
  const claimed = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(enabled)
    .manualActivation(true)
    .onBegin((event) => {
      startY.set(event.absoluteY);
      startX.set(event.absoluteX);
      claimed.set(false);
    })
    .onTouchesMove((event, manager) => {
      const touch = event.allTouches[0];
      if (!touch) return;

      /*
       * Once it is ours, it stays ours.
       *
       * `onTouchesMove` keeps firing after activation, and every test below is
       * a test for whether to TAKE the touch, not for whether to keep it. Left
       * running, a pull held open at the top of its travel could still fail
       * itself on a bit of late sideways drift, cancelling the gesture and
       * dropping a gap the reader was in the middle of opening. That is the
       * other half of "unreliable": not only pulls that never started, but
       * pulls that died on the way.
       */
      if (claimed.get()) return;
      const down = touch.absoluteY - startY.get();
      const across = Math.abs(touch.absoluteX - startX.get());

      /*
       * Say nothing until the touch has actually gone somewhere.
       *
       * Every branch below is final — `fail()` cannot be taken back, and the
       * scroll view keeps the touch for the rest of its life. So the first
       * point or two of travel, which is the finger settling rather than the
       * reader deciding, gets no verdict at all. Without this a single upward
       * pixel of jitter at touch-down killed the pull outright, which is most
       * of why it felt unreliable.
       */
      if (Math.abs(down) < SLOP && across < SLOP) return;

      // Off the top of the shelf, or heading up it: not ours, and saying so
      // hands the touch straight back. The small allowance on the offset
      // absorbs it wobbling around zero.
      if (scrollY.get() > 1 || down < 0) {
        manager.fail();
        return;
      }

      /*
       * Sideways is measured against downward, not against a fixed number.
       *
       * A swipe across to Samwell is nearly all sideways and fails here on its
       * first real movement, which is what this is for. But a thumb pulling
       * down travels on an arc, and it was being held to twelve points of
       * drift over any distance: past about sixty points of pull, an ordinary
       * thumb has drifted further than that and the gesture died mid-pull
       * having already opened the gap. Dominance is the question worth asking.
       */
      if (across > down) {
        manager.fail();
        return;
      }

      if (down > ACTIVATE) {
        claimed.set(true);
        manager.activate();
      }
    })
    .onUpdate((event) => {
      /*
       * Measured from where the pull was CLAIMED, and never below zero.
       *
       * Both halves matter. Without the offset the gap jumps straight to the
       * eleven points `ACTIVATE` had already travelled, so it opens with a
       * pop instead of from nothing.
       *
       * Without the clamp it is worse than untidy: `resist` is only defined
       * for a downward drag, its denominator crosses zero at -115, and past
       * that it returns large POSITIVE numbers — so dragging back up to
       * change your mind, which is the most ordinary thing to do with a pull
       * you did not mean, threw the gap open to 271 points instead of
       * closing it.
       */
      drag.set(resist(Math.max(0, event.translationY - ACTIVATE)));
    })
    .onEnd(() => {
      /*
       * The hold goes up before the finger comes down.
       *
       * Both happen on this frame and on this thread, so the gap is never
       * unheld: `hold` goes to the full gap with no animation while `drag`
       * still has it there, and the unwind below is invisible because the max
       * of the two does not move. This is why the release no longer needs a
       * timing sized to outlast the pipeline.
       */
      if (drag.get() >= TRIGGER) {
        // No animation, and on this thread: the finger is still holding
        // roughly this much, so there is no frame in which the two disagree.
        hold.set(GAP);
        scheduleOnRN(setWaiting, true);
        scheduleOnRN(onSync);
      }
      drag.set(reduced ? 0 : withTiming(0, { duration: motion.base, easing }));
    })
    // A cancelled pan — a call arriving, the app going away — still has to put
    // the gap back, or it stays open with nothing holding it.
    .onFinalize((_event, success) => {
      if (success) return;
      drag.set(reduced ? 0 : withTiming(0, { duration: motion.base, easing }));
    });

  return pan;
}
