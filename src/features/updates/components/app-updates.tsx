import React from 'react';

import { useAppUpdate } from '../hooks/use-app-update';
import { AppUpdateDialog } from './app-update-dialog';

/**
 * Over-the-air updates for the whole app: looked for on launch and on return,
 * and asked for in a dialog once one is downloaded.
 *
 * A container, mounted once at the root beside the navigator, so an update
 * arriving redraws this and not the root layout.
 */
export function AppUpdates() {
  const update = useAppUpdate();
  return <AppUpdateDialog {...update} />;
}
