/**
 * Runs a callback at most once a frame, however often it is asked for.
 *
 * A model's tokens arrive one native callback each. What the chat does with
 * one is not small: it splits the whole reply so far into thought and answer,
 * writes the store, and the bubble draws its markdown again. A small brain on
 * a fast phone hands over several tokens inside a single frame, and each of
 * them paid for a draw nobody saw. Asked through this, they share one.
 */

type Schedule = (run: () => void) => () => void;

/**
 * The next frame, where there are frames. Where there are none (tests, a
 * runtime with no screen) there is nothing to pace against, so it runs now.
 */
const nextFrame: Schedule = (run) => {
  if (typeof requestAnimationFrame !== 'function') {
    run();
    return () => {};
  }
  const handle = requestAnimationFrame(run);
  return () => cancelAnimationFrame(handle);
};

export interface FrameBatch {
  /** Asks for a run on the next frame. Asking again before it comes changes nothing. */
  request(): void;
  /** Runs now if one was asked for and has not happened yet. */
  flush(): void;
}

export function createFrameBatch(run: () => void, schedule: Schedule = nextFrame): FrameBatch {
  let cancel: (() => void) | null = null;
  let pending = false;

  const fire = () => {
    if (!pending) return;
    pending = false;
    cancel = null;
    run();
  };

  return {
    request() {
      if (pending) return;
      pending = true;
      cancel = schedule(fire);
    },
    flush() {
      cancel?.();
      fire();
    },
  };
}
