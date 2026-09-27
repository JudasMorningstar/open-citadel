import { View } from 'react-native';

import { BookTileSkeleton } from '@/components/skeletons/book-tile-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';

/**
 * Stand-in for a grid of `BookGridCard`s: the `muted` panel, the centred 2:3
 * cover inset in it, the title line (the real one wraps to two), and the
 * author line.
 *
 * It takes the same column width the screen derives from the live window and
 * hands to the real cards, and draws each as a `BookTileSkeleton`, which
 * repeats `BookTile`'s own inset maths, so the
 * placeholder grid and the grid that replaces it are the same geometry — the
 * covers do not move when the swap happens.
 */
export function BookGridSkeleton({
  width,
  columns = 2,
  rows = 3,
}: {
  /** Column width in dp — the same number the screen gives `BookGridCard`. */
  width: number;
  columns?: number;
  rows?: number;
}) {
  return (
    <SkeletonGroup label="Loading books" className="gap-4">
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} className="flex-row gap-4">
          {Array.from({ length: columns }, (_, col) => (
            <BookTileSkeleton key={col} width={width} />
          ))}
        </View>
      ))}
    </SkeletonGroup>
  );
}
