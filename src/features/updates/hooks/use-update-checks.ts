import * as Updates from 'expo-updates';
import React from 'react';
import { AppState } from 'react-native';

/** A return to the app this soon after the last check does not ask again. */
const CHECK_GAP_MS = 30 * 60_000;
/**
 * Away this long, and a waiting update is applied on the way back in. They
 * have been gone long enough that coming back to a fresh start is what a cold
 * launch would have given them anyway, and it spares them the dialog.
 */
const AWAY_RELOAD_MS = 30 * 60_000;

/**
 * Looking for updates, beyond what `expo-updates` does on its own.
 *
 * On its own it checks only on a cold start and applies what it finds on the
 * next one. Phones keep apps in memory for days, so a fix could sit unused
 * for as long as nobody force-closed the app. This adds a check on each
 * return to the app, at most every half hour, and a quiet restart into a
 * waiting update on the way back in after a long absence.
 *
 * Both moments are arrivals: the launch, and a return. So the dialog a
 * downloaded update raises lands as someone comes in, not in the middle of a
 * page.
 *
 * `pending` is whether an update is downloaded and waiting. Does nothing in
 * development builds, which load from Metro and have no updates to apply.
 */
export function useUpdateChecks(pending: boolean): void {
  // Read by the AppState listener, which is registered once.
  const waiting = React.useRef(pending);
  React.useEffect(() => {
    waiting.current = pending;
  }, [pending]);

  React.useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    // The launch itself already checked (see the doc above).
    let lastCheck = Date.now();
    let leftAt: number | null = null;

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        leftAt = Date.now();
        return;
      }
      if (state !== 'active') return;

      const away = leftAt === null ? 0 : Date.now() - leftAt;
      leftAt = null;
      if (waiting.current && away >= AWAY_RELOAD_MS) {
        void Updates.reloadAsync().catch((error) => {
          console.warn('[Updates] quiet reload failed', error);
        });
        return;
      }

      if (Date.now() - lastCheck < CHECK_GAP_MS) return;
      lastCheck = Date.now();
      void checkAndDownload();
    });

    return () => subscription.remove();
  }, []);
}

/**
 * Download it if there is one. Finishing flips `isUpdatePending`, which is
 * what raises the dialog. Failures are silent: no signal, or no update server
 * reachable, is not something to tell anyone about, and the next return or
 * launch tries again.
 */
async function checkAndDownload(): Promise<void> {
  try {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) await Updates.fetchUpdateAsync();
  } catch (error) {
    console.warn('[Updates] check failed', error);
  }
}
