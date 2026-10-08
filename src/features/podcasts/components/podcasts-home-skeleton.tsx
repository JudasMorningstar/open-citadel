import React from 'react';
import { View } from 'react-native';

import { HeroCardSkeleton } from '@/components/skeletons/hero-card-skeleton';
import { ShelfHeadingSkeleton } from '@/components/skeletons/shelf-heading-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { PodcastShelvesSkeleton } from '@/features/podcasts/components/podcast-shelves-skeleton';

/**
 * The Podcasts page while its library is read, drawn the way the books side's
 * `LibrarySkeleton` is: the hero card, then two shelves, at their real sizes so
 * nothing moves when the page fills.
 *
 * `hero` is whether the page is expected to lead with that card
 * (`useContinueHint`); without it this is the shelves' placeholder alone.
 */
export function PodcastsHomeSkeleton({ hero }: { hero: boolean }) {
  return (
    <View className="gap-8 pt-6">
      {hero ? (
        <SkeletonGroup label="Loading your podcasts" className="gap-4">
          <ShelfHeadingSkeleton />
          <HeroCardSkeleton mediaAspect={1} />
        </SkeletonGroup>
      ) : null}
      <PodcastShelvesSkeleton label={hero ? undefined : 'Loading your podcasts'} />
    </View>
  );
}
