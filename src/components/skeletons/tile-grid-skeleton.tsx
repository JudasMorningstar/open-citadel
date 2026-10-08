import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { layout, MaxContentWidth } from '@/constants/theme';
import { FeedTileSkeleton } from '@/components/skeletons/feed-tile-skeleton';

const GAP = 16;
const ROWS = [0, 1, 2];

/** `TileGrid` before its tiles have arrived: the same two columns and tile size. `label` says what is loading. */
export function TileGridSkeleton({ label }: { label: string }) {
  const { width } = useWindowDimensions();
  const tile = (Math.min(width, MaxContentWidth) - layout.gutter * 2 - GAP) / 2;
  return (
    <SkeletonGroup label={label} className="gap-4 px-6">
      {ROWS.map((row) => (
        <View key={row} className="flex-row gap-4">
          <FeedTileSkeleton width={tile} />
          <FeedTileSkeleton width={tile} />
        </View>
      ))}
    </SkeletonGroup>
  );
}
