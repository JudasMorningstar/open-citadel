import React from 'react';

import { PullIndicator } from '@/components/pull-indicator';
import type { PullLabels } from '@/hooks/use-pull-to-sync';

/** What a pull says on a podcasts page: the home's and a show's are one check. */
export const NEW_EPISODES_PULL_LABELS: PullLabels = { idle: 'PULL FOR NEW EPISODES', armed: 'RELEASE TO CHECK' };

/** The gap's content for `PullToSync` on a podcasts page. */
export const renderNewEpisodesIndicator = (label: string | undefined) => (
  <PullIndicator caption={label ?? 'CHECKING FOR NEW EPISODES…'} accessibilityLabel="Checking for new episodes" />
);
