import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Handover } from '@/components/navigation/handover';
import { BookGridSkeleton } from '@/components/skeletons/book-grid-skeleton';
import { Spinner } from '@/components/ui/spinner';
import { contentColumn, MaxContentWidth } from '@/constants/theme';
import { BookMasonryGrid, bookGridItemWidth } from '@/features/library/components/book-masonry-grid';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { CatalogBook } from '@/services/gutenberg/records';

type CatalogGridProps = {
  books: CatalogBook[];
  /** The slide has landed and the first page is in. */
  ready: boolean;
  loadingMore: boolean;
  emptyText: string;
  bottomInset: number;
  onOpen: (id: number) => void;
  onEndReached: () => void;
};

/**
 * A whole shelf of free books, two to a row, in the same grid as the Library's
 * own "View all" screens. It pages: the next page is asked for as the last
 * row comes near, with a spinner under it while it comes.
 */
export function CatalogGrid({ books, ready, loadingMore, emptyText, bottomInset, onOpen, onEndReached }: CatalogGridProps) {
  const { width } = useWindowDimensions();
  const tokens = useThemeTokens();
  const itemWidth = React.useMemo(() => bookGridItemWidth(width, MaxContentWidth), [width]);
  const skeleton = (
    <View className="px-6" style={contentColumn}>
      <BookGridSkeleton width={itemWidth} />
    </View>
  );
  const footer = loadingMore ? (
    <View className="items-center py-6">
      <Spinner />
    </View>
  ) : null;

  return (
    <Handover ready={ready} skeleton={skeleton}>
      <BookMasonryGrid
        books={books}
        itemWidth={itemWidth}
        mutedForeground={tokens['--color-muted-foreground']}
        surfaceTertiary={tokens['--color-surface-tertiary']}
        bottomInset={bottomInset}
        emptyText={emptyText}
        style={contentColumn}
        onPress={onOpen}
        onEndReached={onEndReached}
        footer={footer}
      />
    </Handover>
  );
}
