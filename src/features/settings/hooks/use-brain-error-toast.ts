import React from 'react';

import { showToast } from '@/components/toast/toast-provider';
import { closedByPhoneNotice } from '@/services/device-llm/wake-room';
import { useModelStore } from '@/stores/model';

/** One key: a second failure writes over the first rather than stacking under it. */
const BRAIN_ERROR_TOAST_KEY = 'brain-error';

/**
 * Says a brain's failure (a download that broke, a wake that was refused) in
 * a toast, while the card that can cause one is on screen.
 *
 * Only when the error appears, never for one that was already there when the
 * card arrived: that one was said at the time, and repeating it on every
 * visit to Settings would be nagging. The chat draws the same error in its
 * own place, with the ways out of it, and does not use this.
 */
export function useBrainErrorToast() {
  React.useEffect(
    () =>
      useModelStore.subscribe((state, previous) => {
        if (!state.loadError || state.loadError === previous.loadError) return;
        // A brain the phone closed the app over has its whole story behind
        // the card's badge. The toast only has room to point there.
        const brain = state.models.find((model) => model.id === state.activeModelId);
        const closed = brain && state.memoryVerdicts[brain.id] ? closedByPhoneNotice(brain.name) : null;
        showToast({ key: BRAIN_ERROR_TOAST_KEY, message: closed ?? state.loadError });
      }),
    [],
  );
}
