import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createSmoothReveal } from '@/services/smooth-reveal';

const REPLY = 'Your three books are in your Library, and I followed three shows for you.';

describe('createSmoothReveal', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('reveals a reply that arrived whole a few words at a time', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    const settled = reveal.settle();
    await vi.runAllTimersAsync();
    await settled;
    expect(seen.length).toBeGreaterThan(3);
    expect(seen.at(-1)).toBe(REPLY);
    for (let i = 1; i < seen.length; i += 1) expect(seen[i].startsWith(seen[i - 1])).toBe(true);
  });

  it('settles at once when there is nothing left to show', async () => {
    const reveal = createSmoothReveal(() => {});
    await expect(reveal.settle()).resolves.toBeUndefined();
  });

  it('drops pending narration and carries on with the next push', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    const before = seen.at(-1);
    reveal.drop();
    await vi.advanceTimersByTimeAsync(500);
    expect(seen.at(-1)).toBe(before);
    reveal.push('New answer after the tool.');
    await vi.runAllTimersAsync();
    expect(seen.at(-1)).toBe('New answer after the tool.');
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
