import type { Context, MiddlewareHandler } from 'hono';

/** Past this many callers the counts are dropped rather than walked on every request. */
const MAX_TRACKED = 10_000;

/**
 * A per-caller request cap, for the routes that need no sign-in.
 *
 * A fixed window per caller, held in memory: this server is one process, and
 * the only job here is to stop one caller hammering an open route, not to
 * meter anybody. A restart forgets every count, which errs towards letting a
 * reader through.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { count: number; resetAt: number }>();
  let lastSweep = 0;

  return {
    /** Whether this caller may make one more request now; counts it if so. */
    take(key: string, now = Date.now()): { allowed: boolean; retryAfterMs: number } {
      /*
       * Bounded, and cheap to keep bounded. Expired windows are swept at most
       * once a window, not on every request, and if a flood of distinct
       * callers still fills the map it is dropped whole. Forgetting counts
       * lets a few requests through; walking a huge map per request is a way
       * to be slowed down on purpose.
       */
      if (windows.size > MAX_TRACKED && now - lastSweep >= windowMs) {
        lastSweep = now;
        for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k);
        if (windows.size > MAX_TRACKED) windows.clear();
      }
      const current = windows.get(key);
      if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterMs: 0 };
      }
      if (current.count >= limit) return { allowed: false, retryAfterMs: current.resetAt - now };
      current.count += 1;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}

/**
 * Who is calling, as well as a proxied server can tell.
 *
 * The LAST `X-Forwarded-For` entry: the proxy in front of this server
 * (Coolify's) adds the address it actually saw, while anything earlier in the
 * list is whatever the caller chose to send. `CF-Connecting-IP` only when
 * `trustCloudflare` is set, because only Cloudflare can be trusted to have
 * written it: with no Cloudflare in front, any caller can send it and pick
 * their own bucket.
 */
export function clientKey(
  headers: { get(name: string): string | null | undefined },
  { trustCloudflare = false }: { trustCloudflare?: boolean } = {},
): string {
  if (trustCloudflare) {
    const cloudflare = headers.get('cf-connecting-ip')?.trim();
    if (cloudflare) return cloudflare;
  }
  const last = headers.get('x-forwarded-for')?.split(',').pop()?.trim();
  return last || 'unknown';
}

/**
 * Set when this server is deployed behind Cloudflare (it is not today: it
 * answers directly from its host). Behind Cloudflare, the last forwarded
 * address is Cloudflare's own, shared by many readers.
 */
const TRUST_CLOUDFLARE = process.env.TRUST_CLOUDFLARE_IP === 'true';

/** The limiter as middleware: a 429 with `Retry-After` past the cap. */
export function rateLimit(options: { limit: number; windowMs: number }): MiddlewareHandler {
  const limiter = createRateLimiter(options);
  return async (c: Context, next) => {
    const key = clientKey({ get: (name) => c.req.header(name) }, { trustCloudflare: TRUST_CLOUDFLARE });
    const { allowed, retryAfterMs } = limiter.take(key);
    if (!allowed) {
      c.header('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
      return c.json({ error: 'Too many requests. Try again in a moment.' }, 429);
    }
    await next();
  };
}
