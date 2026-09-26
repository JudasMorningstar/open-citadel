import React from 'react';

import { PullIndicator } from '@/components/pull-indicator';
import { useSyncState, type SyncState } from '@/stores/books';

/**
 * What the scan is doing, in the two words it takes to say it.
 *
 * A pure function and not a ternary in JSX because there are four phases, each
 * with a counted and an uncounted form, and written inline that is a five-deep
 * conditional nobody can read — which is what it was.
 *
 * The counts are only shown once there is a total to count against. A scan
 * that has not finished listing the folder knows how many files it has walked
 * past and not how many there are, and "SCANNING 7/0" is worse than saying
 * nothing about the number at all.
 */
function stepLabel(sync: SyncState): string {
  const counted = (verb: string) =>
    sync.total > 0 ? `${verb} ${sync.done}/${sync.total}` : `${verb}…`;

  switch (sync.phase) {
    case 'scanning':
      return counted('SCANNING');
    case 'importing':
      return counted('IMPORTING');
    case 'preparing':
      return counted('PREPARING');
    case 'finalizing':
      return 'FINALIZING…';
    default:
      return 'SYNCING BOOKS…';
  }
}

/**
 * The book scan, in the pull-to-sync gap: the house `PullIndicator` with the
 * step the scan is on.
 *
 * ## Why this one reads the store
 *
 * Almost nothing in this app does, and this is the exception the rule is for.
 * A scan emits progress several times a second and the step is the only thing
 * on the screen that changes with it, so taking `sync` as a prop means every
 * ancestor that has to pass it down re-renders at that rate too. Measured on
 * device: the Library re-rendered its whole tree eighteen times over one
 * launch scan, shelves and book cards included, to move one line of text.
 * Subscribed HERE, the ticking stops at this leaf.
 */
export const SyncIndicator = React.memo(function SyncIndicator({
  label,
  className,
}: {
  /** Said instead of the step, for the moment before a scan exists: the pull asking to be let go of. */
  label?: string;
  className?: string;
}) {
  const sync = useSyncState();
  return <PullIndicator caption={label ?? stepLabel(sync)} accessibilityLabel="Syncing books" className={className} />;
});
