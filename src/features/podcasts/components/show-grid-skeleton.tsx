import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { layout, MaxContentWidth } from '@/constants/theme';
import { ShowTileSkeleton } from '@/features/podcasts/components/show-tile-skeleton';

const GAP = 16;
const ROWS = [0, 1, 2];

/** `ShowGrid` before its shows have arrived: the same two columns and tile size. */
export function ShowGridSkeleton() {
  const { width } = useWindowDimensions();
  const tile = (Math.min(width, MaxContentWidth) - layout.gutter * 2 - GAP) / 2;
  return (
    <SkeletonGroup label="Loading shows" className="gap-4 px-6">
      {ROWS.map((row) => (
        <View key={row} className="flex-row gap-4">
          <ShowTileSkeleton width={tile} />
          <ShowTileSkeleton width={tile} />
        </View>
      ))}
    </SkeletonGroup>
  );
}
