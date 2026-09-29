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

  it('shows the whole narration on flush, then reveals what follows it', async () => {
    const seen: string[] = [];
    const reveal = createSmoothReveal((text) => seen.push(text));
    reveal.push(REPLY);
    reveal.flush();
    expect(seen.at(-1)).toBe(REPLY);
    const count = seen.length;
    await vi.advanceTimersByTimeAsync(500);
    expect(seen.length).toBe(count);
    const next = `${REPLY}\n\nAnd here is what I found once it was done.`;
    reveal.push(next);
    expect(seen.at(-1)?.startsWith(REPLY)).toBe(true);
    await vi.runAllTimersAsync();
    expect(seen.at(-1)).toBe(next);
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
