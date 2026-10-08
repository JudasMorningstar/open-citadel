import React from 'react';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

/** A free book's summary before the page has landed and its catalog entry is in: its first lines. */
export function FreeBookAboutSkeleton() {
  return (
    <SkeletonGroup label="Loading about the book" className="gap-2 px-6 pb-4">
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-2/3" />
    </SkeletonGroup>
  );
}
