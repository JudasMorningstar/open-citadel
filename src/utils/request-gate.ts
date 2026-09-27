/**
 * A cap on how many requests to one server are in flight at once. Past the
 * cap, a request waits its turn, in the order it asked, so on a slow
 * connection the first things asked for (the shelves at the top) arrive
 * first.
 *
 * `turn()` resolves with the function that gives the turn back; call it in a
 * `finally`.
 */
export function createRequestGate(maxInFlight: number) {
  let inFlight = 0;
  const waiters: (() => void)[] = [];

  return async function turn(): Promise<() => void> {
    if (inFlight >= maxInFlight) await new Promise<void>((resolve) => waiters.push(resolve));
    inFlight += 1;
    return () => {
      inFlight -= 1;
      waiters.shift()?.();
    };
  };
}
