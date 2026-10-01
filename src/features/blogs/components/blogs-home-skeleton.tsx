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
 */
export function BlogsHomeSkeleton() {
  return (
    <View className="gap-8 pt-6">
      <SkeletonGroup label="Loading your blogs" className="gap-4">
        <ShelfHeadingSkeleton />
        <HeroCardSkeleton mediaAspect={1} />
      </SkeletonGroup>
      <BlogShelvesSkeleton />
    </View>
  );
}
