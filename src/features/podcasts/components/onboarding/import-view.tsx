import React from 'react';

import { ImportDone } from '@/features/podcasts/components/onboarding/import-done';
import { ImportFailed } from '@/features/podcasts/components/onboarding/import-failed';
import { ImportRunning } from '@/features/podcasts/components/onboarding/import-running';
import type { ActiveImport } from '@/features/podcasts/hooks/use-antennapod-import';

type ImportViewProps = {
  state: ActiveImport;
  bottomPadding: number;
  onDone: () => void;
  onRetry: () => void;
  onCancel: () => void;
};

/**
 * An import running, finished, or stopped: in place of the page it was
 * started from, so the listener never leaves it.
 */
export function ImportView({ state, bottomPadding, onDone, onRetry, onCancel }: ImportViewProps) {
  switch (state.phase) {
    case 'running':
      return <ImportRunning progress={state.progress} bottomPadding={bottomPadding} />;
    case 'failed':
      return <ImportFailed message={state.message} bottomPadding={bottomPadding} onRetry={onRetry} onCancel={onCancel} />;
    case 'done':
      return <ImportDone result={state.result} bottomPadding={bottomPadding} onDone={onDone} />;
  }
}
