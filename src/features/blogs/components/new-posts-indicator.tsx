import React from 'react';

import { PullIndicator } from '@/components/pull-indicator';
import type { PullLabels } from '@/hooks/use-pull-to-sync';

/** What a pull says on a blogs page: the home's and a blog's are one check. */
export const NEW_POSTS_PULL_LABELS: PullLabels = { idle: 'PULL FOR NEW POSTS', armed: 'RELEASE TO CHECK' };

/** The gap's content for `PullToSync` on a blogs page. */
export const renderNewPostsIndicator = (label: string | undefined) => (
  <PullIndicator caption={label ?? 'CHECKING FOR NEW POSTS…'} accessibilityLabel="Checking for new posts" />
);
