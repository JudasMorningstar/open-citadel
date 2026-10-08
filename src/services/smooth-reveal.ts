/**
 * Paces a cloud reply onto the screen, whatever the provider sends.
 *
 * A reply streamed token by token passes through at about the pace it
 * arrives. One released whole (Azure holds some models' output and sends it
 * in a single piece) is shown a word at a time at a calm reading pace: see
 * `revealRate`. Timed by the clock rather than by counting ticks, so a busy
 * JS thread slows nothing down, and written only when a new word appears, so
 * the store is not written on every tick.
 *
 * The turn waits on `settle` before it moves on (a tool status, a card, the
 * next part of the reply), so each thing Samwell says has finished arriving
 * before the next thing appears.
 */
import { MAX_REVEAL_MS, revealRate, wholeWordsUpTo } from '@/utils/reveal-step';

const TICK_MS = 32;
/** A backstop on `settle`, so a turn can never wait on the reveal for long. */
const SETTLE_CAP_MS = MAX_REVEAL_MS + 1_500;

export type SmoothReveal = {
  /** The text the reply has reached so far. */
  push: (text: string) => void;
  /** Resolves once everything pushed has been shown. */
  settle: () => Promise<void>;
  /** Stops for good: nothing more is written, and `settle` resolves at once. */
  cancel: () => void;
};

export function createSmoothReveal(emit: (text: string) => void): SmoothReveal {
  let target = '';
  let shown = '';
  // How far the reveal has got, in characters; `shown` is its whole words.
  let cursor = 0;
  let lastTickAt = 0;
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

  const show = (end: number) => {
    if (end <= shown.length) return;
    shown = target.slice(0, end);
    emit(shown);
  };

  const showAll = () => {
    if (!cancelled) show(target.length);
    stop();
    release();
  };

  const tick = () => {
    const now = Date.now();
    cursor += (revealRate(target.length) * (now - lastTickAt)) / 1000;
    lastTickAt = now;
    show(wholeWordsUpTo(target, cursor));
    if (shown.length >= target.length) {
      stop();
      release();
    }
  };

  return {
    push(text) {
      if (cancelled) return;
      // Text that does not continue what is on screen (the next part of the
      // reply) is revealed from its own start.
      if (!text.startsWith(shown)) {
        shown = '';
        cursor = 0;
      }
      target = text;
      if (!timer && shown.length < target.length) {
        // On from what is on screen, not from a cursor that ran on while idle.
        cursor = shown.length;
        lastTickAt = Date.now();
        timer = setInterval(tick, TICK_MS);
      }
    },
    settle() {
      if (cancelled || shown.length >= target.length) return Promise.resolve();
      return new Promise<void>((resolve) => {
        // Past the backstop: show the rest now rather than hold the turn.
        const cap = setTimeout(showAll, SETTLE_CAP_MS);
        waiters.push(() => {
          clearTimeout(cap);
          resolve();
        });
      });
    },
    cancel() {
      cancelled = true;
      stop();
      release();
    },
  };
}
