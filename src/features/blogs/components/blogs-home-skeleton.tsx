import React from 'react';
import { View } from 'react-native';

import { HeroCardSkeleton } from '@/components/skeletons/hero-card-skeleton';
import { ShelfHeadingSkeleton } from '@/components/skeletons/shelf-heading-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { BlogShelvesSkeleton } from '@/features/blogs/components/blog-shelves-skeleton';

/**
 * The Blogs page while its library is read, drawn the way the books' and the
 * podcasts' are: the Continue Reading card, then a shelf of posts and a shelf
 * of blogs, at their real sizes so nothing moves when the page fills.
 *
 * `hero` is whether the page is expected to lead with that card
 * (`useContinueHint`). Without it this is the shelves' placeholder alone,
 * which is what `BlogsHome` goes on to draw while they mount.
 */
export function BlogsHomeSkeleton({ hero }: { hero: boolean }) {
  return (
    <View className="gap-8 pt-6">
      {hero ? (
        <SkeletonGroup label="Loading your blogs" className="gap-4">
          <ShelfHeadingSkeleton />
          <HeroCardSkeleton mediaAspect={1} />
        </SkeletonGroup>
      ) : null}
      <BlogShelvesSkeleton label={hero ? undefined : 'Loading your blogs'} />
    </View>
  );
}
