import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { contentColumn } from '@/constants/theme';

/** An episode's chapters and notes before the page has landed: a section heading and its first lines. */
export function EpisodeDetailsSkeleton() {
  return (
    <View style={contentColumn}>
      <SkeletonGroup label="Loading the show notes" className="gap-3">
        <SkeletonBar className="h-6 w-32" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-4/5" />
      </SkeletonGroup>
    </View>
  );
}
