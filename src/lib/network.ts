/**
 * Whether the phone has a connection (`expo-network`), and being told when
 * that changes.
 *
 * One place, so the query cache and anything that wants to say "you are
 * offline" read the same answer. See `query-client.ts` for what the cache does
 * with it and `hooks/use-online.ts` for reading it in a component.
 */

type NetworkModule = typeof import('expo-network');
let networkModule: NetworkModule | null | undefined;

/** The module, or null in a dev build made before `expo-network` was added. */
function network(): NetworkModule | null {
  if (networkModule !== undefined) return networkModule;
  try {
    // The currently installed dev build may predate expo-network. Without it
    // the app carries on as it always did, assuming it is online.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    networkModule = require('expo-network') as NetworkModule;
  } catch {
    networkModule = null;
  }
  return networkModule;
}

/**
 * Calls `onChange` with whether the phone is connected: once with the answer
 * now, then on every change. Returns the way to stop.
 *
 * "Connected" is having a network, not having reached the internet through
 * it: `isInternetReachable` is a probe that lags and can be wrong behind a
 * captive portal either way, and a request that fails says so itself.
 */
export function watchConnection(onChange: (online: boolean) => void): () => void {
  const module = network();
  if (!module) return () => undefined;

  let heard = false;
  const subscription = module.addNetworkStateListener((state) => {
    heard = true;
    onChange(state.isConnected !== false);
  });
  module
    .getNetworkStateAsync()
    .then((state) => {
      if (!heard) onChange(state.isConnected !== false);
    })
    // It can reject on some platforms; the listener still reports changes.
    .catch(() => undefined);

  return () => subscription.remove();
}
