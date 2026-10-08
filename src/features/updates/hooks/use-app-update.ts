import * as Updates from 'expo-updates';
import React from 'react';
import { Keyboard } from 'react-native';

import { haptics } from '@/utils/haptics';

import { notesFromManifest } from '../utils/release-notes';
import type { UpdatePhase } from '../utils/update-copy';
import { useUpdateChecks } from './use-update-checks';

/**
 * An update that has been downloaded, as the dialog that asks for the restart.
 *
 * The dialog cannot be put off: a fix is for everyone it reaches, and an app
 * left running the old code is where the reports it was meant to end keep
 * coming from. It has one way out, and only after a restart has failed (see
 * `updateCopy`).
 *
 * Returns the props `AppUpdateDialog` takes.
 */
export function useAppUpdate() {
  const { isUpdatePending, downloadedUpdate } = Updates.useUpdates();
  const pendingId = isUpdatePending ? (downloadedUpdate?.updateId ?? 'pending') : null;
  useUpdateChecks(pendingId !== null);

  const [restarting, setRestarting] = React.useState(false);
  // What happened to which update, by its id, so a newer one that arrives
  // while this is up starts clean: it is asked for again, and is not shown as
  // having failed because the one before it did.
  const [failedId, setFailedId] = React.useState<string | null>(null);
  const [leftId, setLeftId] = React.useState<string | null>(null);
  const visible = pendingId !== null && pendingId !== leftId;
  const failed = pendingId !== null && failedId === pendingId;
  const phase: UpdatePhase = restarting ? 'restarting' : failed ? 'failed' : 'ready';

  // A keyboard left up would sit over the dialog's one button.
  React.useEffect(() => {
    if (visible) Keyboard.dismiss();
  }, [visible]);

  const manifest = downloadedUpdate?.manifest;
  const notes = React.useMemo(() => notesFromManifest(manifest), [manifest]);

  // One restart at a time. The button stops taking presses once it redraws
  // as a spinner, but two taps can land before that, and the second restart
  // is refused while the first is under way: it would report a failure over
  // a restart that is about to work.
  const underWay = React.useRef(false);
  const onUpdate = React.useCallback(() => {
    if (underWay.current) return;
    underWay.current = true;
    setRestarting(true);
    // Two frames on, not now: the restart tears the screen down as it is, and
    // started in the press's own tick that is a button caught mid-press with
    // no spinner, which reads as a tap that did nothing.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        Updates.reloadAsync().catch((error) => {
          console.warn('[Updates] restart failed', error);
          underWay.current = false;
          haptics.warn();
          setRestarting(false);
          setFailedId(pendingId);
        });
      });
    });
  }, [pendingId]);

  const onLeave = React.useCallback(() => setLeftId(pendingId), [pendingId]);

  return { visible, phase, notes, onUpdate, onLeave };
}
