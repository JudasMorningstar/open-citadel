import React from 'react';

import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { EpisodeRowsSkeleton } from '@/features/podcasts/components/episode-rows-skeleton';

/** A "View all" list of episodes before it has landed. */
export function EpisodeListSkeleton() {
  return (
    <SkeletonGroup label="Loading episodes">
      <EpisodeRowsSkeleton count={5} />
    </SkeletonGroup>
  );
}
