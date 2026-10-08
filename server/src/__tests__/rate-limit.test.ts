import { describe, expect, it } from 'vitest';

import { clientKey, createRateLimiter } from '../rate-limit.js';

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] });

describe('createRateLimiter', () => {
  it('lets the limit through, refuses the next, and opens again with a new window', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(limiter.take('a', 0).allowed).toBe(true);
    expect(limiter.take('a', 10).allowed).toBe(true);
    expect(limiter.take('a', 20)).toEqual({ allowed: false, retryAfterMs: 980 });
    expect(limiter.take('a', 1000).allowed).toBe(true);
  });

  it('counts each caller apart', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.take('a', 0).allowed).toBe(true);
    expect(limiter.take('b', 0).allowed).toBe(true);
    expect(limiter.take('a', 1).allowed).toBe(false);
  });
});

describe('clientKey', () => {
  it('takes the address the proxy appended, not one the caller wrote', () => {
    expect(clientKey(headers({ 'x-forwarded-for': '6.6.6.6, 3.3.3.3' }))).toBe('3.3.3.3');
  });

  it('ignores a Cloudflare header nobody said to trust, since any caller can send one', () => {
    expect(clientKey(headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' }))).toBe('2.2.2.2');
  });

  it('uses Cloudflare’s header when it is really in front', () => {
    const behindCloudflare = headers({ 'cf-connecting-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' });
    expect(clientKey(behindCloudflare, { trustCloudflare: true })).toBe('1.1.1.1');
  });

  it('falls back to one shared key', () => {
    expect(clientKey(headers({}))).toBe('unknown');
  });
});

describe('a flood of callers', () => {
  it('keeps the map bounded without walking it on every request', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    for (let i = 0; i < 10_001; i += 1) limiter.take(`caller-${i}`, 5000);
    // Still inside everyone's window, so only the drop can let caller-0 through again.
    expect(limiter.take('caller-0', 5001).allowed).toBe(true);
  });
});
