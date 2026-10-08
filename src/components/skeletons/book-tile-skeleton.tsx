import { View } from 'react-native';

import { SkeletonBar } from '@/components/skeletons/skeleton-group';

/**
 * One `BookTile` before its book has arrived: the panel, the centred 2:3
 * cover inset in it, and bars for the title and author at their lines' heights. It repeats
 * `BookTile`'s own inset maths (`p-4` either side, then 62% of what is left),
 * so the covers do not move when the real tiles replace it. Pulses only
 * inside a `SkeletonGroup`.
 */
export function BookTileSkeleton({ width, titleLines = 2 }: { width: number; titleLines?: 1 | 2 }) {
  const coverWidth = Math.round((width - 32) * 0.62);
  // The text rows at the real type's line heights (`headlineSm` 24, `bodySm` 20).
  const titleHeight = { height: 24 * titleLines };
  return (
    <View className="gap-3 bg-muted p-4" style={{ width }}>
      <View className="items-center">
        <View style={{ width: coverWidth }}>
          <SkeletonBar className="aspect-[2/3] w-full" />
        </View>
      </View>
      <View className="gap-1">
        <View className="justify-center gap-2" style={titleHeight}>
          <SkeletonBar className="h-4 w-5/6" />
          {titleLines === 2 ? <SkeletonBar className="h-4 w-1/2" /> : null}
        </View>
        <View className="h-5 justify-center">
          <SkeletonBar className="h-3 w-1/2" />
        </View>
      </View>
    </View>
  );
}
