import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { CircleCheckBig } from '@/components/icons';
import React from 'react';
import { ScrollView } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { RowFade } from '@/components/scroll-fades';

import { BookTile } from '@/features/library/components/book-tile';
import { asColor } from '@/utils/colors';
import type { Book } from '@/stores/books';


type ArchivedCardProps = {
  books: Book[];
  onBookPress?: (bookId: string) => void;
  onBookLongPress?: (book: Book) => void;
};

/**
 * `memo`'d: the library page re-renders on every sync tick, and without
 * this each one rebuilt every shelf and every tile on it.
 */
export const ArchivedCards = React.memo(function ArchivedCards({ books, onBookPress, onBookLongPress }: ArchivedCardProps) {
  const [ghostInk, mutedForeground, primary] = useCSSVariable([
    '--color-surface-tertiary',
    '--color-muted-foreground',
    '--color-primary',
  ]);

  // The fade is the affordance: it says there is more past the edge, and
  // it shows only when there actually is.
  return (
    <RowFade>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-4 px-6"
      >
        {books.map((book) => (
          <BookTile
            key={book.id}
            book={book}
            width={SHELF_TILE_WIDTH}
            mutedForeground={asColor(mutedForeground)}
            surfaceTertiary={asColor(ghostInk)}
            titleLines={1}
            badgeIcon={CircleCheckBig}
            badgeColor={asColor(primary)}
            onPress={onBookPress}
            onLongPress={onBookLongPress}
          />
        ))}
      </ScrollView>
    </RowFade>
  );
});
