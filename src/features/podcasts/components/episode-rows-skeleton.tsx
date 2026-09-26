import React from 'react';
import { View } from 'react-native';

import { SkeletonBar } from '@/components/skeletons/skeleton-group';
import { EpisodeSeparator } from '@/features/podcasts/components/episode-separator';

/**
 * Episode rows before their episodes have arrived, each the height of a real
 * one, so the list fills in place. Pulses only inside a `SkeletonGroup`.
 */
export function EpisodeRowsSkeleton({ count = 4 }: { count?: number }) {
  const rows = Array.from({ length: count }, (_, i) => i);
  return (
    <View>
      {rows.map((i) => (
        <View key={i}>
          {i > 0 ? <EpisodeSeparator /> : null}
          <View className="gap-3 px-6 py-5">
            <SkeletonBar className="h-2.5 w-1/3" />
            <View className="gap-2">
              <SkeletonBar className="h-4 w-11/12" />
              <SkeletonBar className="h-4 w-3/5" />
            </View>
            <SkeletonBar className="h-3 w-4/5" />
            <SkeletonBar className="h-9 w-24" />
          </View>
        </View>
      ))}
    </View>
  );
}
