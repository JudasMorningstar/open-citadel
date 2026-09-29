import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSmoothReveal } from '@/services/smooth-reveal';
import { REVEAL_CHARS_PER_SECOND } from '@/utils/reveal-step';

const REPLY = 'Your three books are in your Library, and I followed three shows for you.';

describe('createSmoothReveal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reveals a reply that arrived whole a word at a time, growing only', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    const settled = reveal.settle();
    await vi.runAllTimersAsync();
    await settled;
    expect(seen.length).toBeGreaterThan(8);
    expect(seen.at(-1)).toBe(REPLY);
    for (let i = 1; i < seen.length; i += 1) expect(seen[i].startsWith(seen[i - 1])).toBe(true);
  });

  it('takes about as long as the calm pace says', async () => {
    const reveal = createSmoothReveal(() => {});
    reveal.push(REPLY);
    let done = false;
    void reveal.settle().then(() => {
      done = true;
    });
    const expected = (REPLY.length / REVEAL_CHARS_PER_SECOND) * 1000;
    await vi.advanceTimersByTimeAsync(expected * 0.8);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(expected * 0.3);
    expect(done).toBe(true);
  });

  it('settles at once when there is nothing left to show', async () => {
    const reveal = createSmoothReveal(() => {});
    await expect(reveal.settle()).resolves.toBeUndefined();
  });

  it('reveals the next part of a reply from its own start', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    await vi.runAllTimersAsync();
    const before = seen.length;
    const next = 'Here is what I found.';
    reveal.push(next);
    await vi.runAllTimersAsync();
    const after = seen.slice(before);
    expect(after[0]).toBe('Here');
    expect(after.at(-1)).toBe(next);
  });

  it('writes nothing after cancel, and releases anyone waiting', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    const settled = reveal.settle();
    reveal.cancel();
    await settled;
    const count = seen.length;
    reveal.push(`${REPLY} More.`);
    await vi.runAllTimersAsync();
    expect(seen.length).toBe(count);
  });
});
