import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { spacing } from '@/constants/theme';
import { ReadingSkeleton } from '@/features/reader/components/reading-skeleton';

/**
 * The reader before its book is in hand: the header bar's shape over a page
 * of lines. A skeleton, not a spinner, because the reader's chrome is known
 * before the book decodes, so the real layout settles in place.
 */
export function ReaderLoading({ top }: { top: number }) {
  return (
    <View className="flex-1 bg-background">
      {/* Header bar: back control, title line, trailing icon. */}
      <SkeletonGroup>
        <View className="flex-row items-center gap-2 px-4" style={{ paddingTop: top + spacing[2], paddingBottom: spacing[3] }}>
          <SkeletonBar className="h-9 w-9" />
          <SkeletonBar className="h-4 flex-1" />
          <SkeletonBar className="h-9 w-9" />
        </View>
      </SkeletonGroup>
      <ReadingSkeleton label="Loading book" />
    </View>
  );
}
