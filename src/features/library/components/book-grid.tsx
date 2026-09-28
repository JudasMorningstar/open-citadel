import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { Handover } from '@/components/navigation/handover';
import { BookGridSkeleton } from '@/components/skeletons/book-grid-skeleton';
import { contentColumn, MaxContentWidth } from '@/constants/theme';
import { BookMasonryGrid, bookGridItemWidth } from '@/features/library/components/book-masonry-grid';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { Book } from '@/stores/books';

const COLUMNS = 2;

type BookGridProps = {
  books: Book[];
  /** Whether the screen has landed; the grid waits for it. */
  ready: boolean;
  emptyText: string;
  bottomInset: number;
  onOpen: (bookId: string) => void;
  onMenu: (book: Book) => void;
};

/**
 * The books of a "View all" or a collection, as a two-column grid.
 *
 * Held until the screen has settled, behind a placeholder grid of the same
 * geometry, so the wait is the shape of the books rather than an empty
 * screen. Mounting it mid-push competed with the transition for the UI thread
 * and stalled the slide near its end (see `Handover`).
 */
export function BookGrid({ books, ready, emptyText, bottomInset, onOpen, onMenu }: BookGridProps) {
  const { width } = useWindowDimensions();
  const tokens = useThemeTokens();
  // Half the live width minus one gap and both side pads, bounded by the
  // content column. Memoized so it keeps one identity across search keystrokes.
  const itemWidth = React.useMemo(() => bookGridItemWidth(width, MaxContentWidth), [width]);
  const skeleton = (
    <View className="px-6" style={contentColumn}>
      <BookGridSkeleton width={itemWidth} columns={COLUMNS} />
    </View>
  );

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
        onLongPress={onMenu}
      />
    </Handover>
  );
}
