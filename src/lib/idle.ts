/**
 * Work that can wait for the JS thread to have nothing better to do.
 *
 * Everything in this app shares one JS thread: React's renders, every SQLite
 * read (drizzle's expo driver is synchronous) and every parse. Work started
 * "after first paint" therefore lands in exactly the moment the first screen
 * is trying to fill in, and the screen waits behind it. An idle callback runs
 * only once nothing else is queued, so the visible work always goes first.
 *
 * `timeoutMs` is the longest it may be put off: a thread that never goes
 * quiet (a long reply streaming) must not starve it for good.
 */
export function onIdle(run: () => void, timeoutMs: number): () => void {
  if (typeof requestIdleCallback !== 'function') {
    const timer = setTimeout(run, 0);
    return () => clearTimeout(timer);
  }
  const handle = requestIdleCallback(run, { timeout: timeoutMs });
  return () => cancelIdleCallback(handle);
}

/** The same wait, for a chain of awaits. */
export function whenIdle(timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    onIdle(resolve, timeoutMs);
  });
}
