import { describe, expect, it, vi } from 'vitest';

import { createFrameBatch } from '../frame-batch';

/** A frame the test turns by hand. */
function manualFrames() {
  let queued: (() => void) | null = null;
  const cancelled = vi.fn();
  return {
    schedule: (run: () => void) => {
      queued = run;
      return () => {
        queued = null;
        cancelled();
      };
    },
    turn: () => {
      const run = queued;
      queued = null;
      run?.();
    },
    cancelled,
  };
}

describe('createFrameBatch', () => {
  it('runs once a frame, however many times it is asked', () => {
    const frames = manualFrames();
    const run = vi.fn();
    const batch = createFrameBatch(run, frames.schedule);

    batch.request();
    batch.request();
    batch.request();
    expect(run).not.toHaveBeenCalled();

    frames.turn();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('runs again for what is asked after a frame', () => {
    const frames = manualFrames();
    const run = vi.fn();
    const batch = createFrameBatch(run, frames.schedule);

    batch.request();
    frames.turn();
    batch.request();
    frames.turn();
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('flushes what is waiting at once, and not a second time when the frame comes', () => {
    const frames = manualFrames();
    const run = vi.fn();
    const batch = createFrameBatch(run, frames.schedule);

    batch.request();
    batch.flush();
    expect(run).toHaveBeenCalledTimes(1);
    expect(frames.cancelled).toHaveBeenCalledTimes(1);

    frames.turn();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('does nothing on a flush with nothing waiting', () => {
    const run = vi.fn();
    const batch = createFrameBatch(run, manualFrames().schedule);
    batch.flush();
    expect(run).not.toHaveBeenCalled();
  });

  it('runs straight away where there are no frames to wait for', () => {
    const run = vi.fn();
    const batch = createFrameBatch(run);
    batch.request();
    expect(run).toHaveBeenCalledTimes(1);
  });
});
