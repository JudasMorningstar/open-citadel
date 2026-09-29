/**
 * Paces a cloud reply onto the screen, whatever the provider sends.
 *
 * A reply streamed token by token passes through close to as it arrives. One
 * released whole (Azure holds some models' output and sends it in a single
 * piece) is shown a few words at a time, caught up in about a second: see
 * `nextRevealLength` for the pace. It replaces a plain throttle, so it also
 * keeps the store from being written on every token.
 *
 * The turn waits on `settle` before it returns, so the message is committed
 * only once the reader has seen all of it, and the hand-over from the
 * streaming bubble to the stored one does not jump.
 */
import { nextRevealLength } from '@/utils/reveal-step';

const TICK_MS = 40;
/** A backstop on `settle`, so a turn can never wait on the reveal for long. */
const SETTLE_CAP_MS = 2_500;

export type SmoothReveal = {
  /** The text the reply has reached so far. */
  push: (text: string) => void;
  /** Resolves once everything pushed has been shown. */
  settle: () => Promise<void>;
  /**
   * Drops what is still waiting to be shown, and carries on with whatever is
   * pushed next. A tool call does this to the narration before it: the
   * reading and Compass stores blank the bubble when a tool starts, and a
   * trailing reveal would write the narration back into it.
   */
  drop: () => void;
  /** Stops for good: nothing more is written, and `settle` resolves at once. */
  cancel: () => void;
};

export function createSmoothReveal(emit: (text: string) => void): SmoothReveal {
  let target = '';
  let shown = '';
  let timer: ReturnType<typeof setInterval> | null = null;
  let cancelled = false;
  let waiters: (() => void)[] = [];

  const release = () => {
    const done = waiters;
    waiters = [];
    for (const resolve of done) resolve();
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  const tick = () => {
    shown = target.slice(0, nextRevealLength(shown.length, target));
    emit(shown);
    if (shown.length >= target.length) {
      stop();
      release();
    }
  };

  return {
    push(text) {
      if (cancelled) return;
      // Text that does not continue what is on screen (a new message after a
      // tool call) is revealed from its own start rather than dumped at once.
      if (!text.startsWith(shown)) shown = '';
      target = text;
      if (!timer && shown.length < target.length) {
        tick();
        if (shown.length < target.length) timer = setInterval(tick, TICK_MS);
      }
    },
    settle() {
      if (cancelled || shown.length >= target.length) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const cap = setTimeout(() => {
          // Past the backstop: show the rest now rather than hold the turn.
          if (!cancelled && shown.length < target.length) {
            shown = target;
            emit(shown);
          }
          stop();
          release();
        }, SETTLE_CAP_MS);
        waiters.push(() => {
          clearTimeout(cap);
          resolve();
        });
      });
    },
    drop() {
      target = shown;
      stop();
      release();
    },
    cancel() {
      cancelled = true;
      stop();
      release();
    },
  };
}
