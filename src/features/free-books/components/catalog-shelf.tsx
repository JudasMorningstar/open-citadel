import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';
import { BookTileSkeleton } from '@/components/skeletons/book-tile-skeleton';
import { SkeletonGroup } from '@/components/skeletons/skeleton-group';
import { ThemedText } from '@/components/themed-text';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import type { ShelfState } from '@/features/free-books/hooks/use-catalog-shelves';
import { BookTile } from '@/features/library/components/book-tile';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { CatalogBook } from '@/services/gutenberg/records';
import type { CatalogShelf as Shelf } from '@/services/gutenberg/shelves';

type CatalogShelfProps = {
  shelf: Shelf;
  state: ShelfState;
  onOpen: (id: number) => void;
  onViewAll: (shelf: Shelf) => void;
};

const PLACEHOLDERS = [0, 1, 2];
const keyOf = (book: CatalogBook) => String(book.id);

/** Three tile shapes, pulsing together, while the shelf is on its way. */
function LoadingRow() {
  return (
    <SkeletonGroup className="flex-row gap-4 px-6">
      {PLACEHOLDERS.map((i) => (
        <BookTileSkeleton key={i} width={SHELF_TILE_WIDTH} titleLines={1} />
      ))}
    </SkeletonGroup>
  );
}

/** One of Project Gutenberg's shelves as a row of its first books, with VIEW ALL for the rest. */
export const CatalogShelf = React.memo(function CatalogShelf({ shelf, state, onOpen, onViewAll }: CatalogShelfProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const ghost = tokens['--color-surface-tertiary'];
  const viewAll = React.useCallback(() => onViewAll(shelf), [shelf, onViewAll]);
  const renderTile = React.useCallback(
    (book: CatalogBook) => (
      <BookTile book={book} width={SHELF_TILE_WIDTH} mutedForeground={muted} surfaceTertiary={ghost} titleLines={1} onPress={onOpen} />
    ),
    [ghost, muted, onOpen],
  );

  const body =
    state.status === 'failed' ? (
      <ThemedText type="bodySm" color={muted} className="px-6">
        This shelf could not be loaded. Check your connection.
      </ThemedText>
    ) : state.status === 'ready' ? (
      <ShelfRow items={state.books} keyOf={keyOf} renderTile={renderTile} />
    ) : (
      <LoadingRow />
    );

  return (
    <ShelfSection title={shelf.label} onViewAll={viewAll}>
      {body}
    </ShelfSection>
  );
});
