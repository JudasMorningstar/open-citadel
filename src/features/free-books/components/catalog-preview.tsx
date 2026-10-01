import React from 'react';

import { ShelvesPreview, type PreviewShelf } from '@/components/shelves-preview';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import type { ShelfState } from '@/features/free-books/hooks/use-catalog-shelves';
import { BookTile } from '@/features/library/components/book-tile';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { CATALOG_SHELVES, type CatalogShelf } from '@/services/gutenberg/shelves';

/** What fits on the first screen: three shelves, three tiles each (the third cut by the edge). */
const PREVIEW_SHELVES = CATALOG_SHELVES.slice(0, 3);
const PREVIEW_TILES = 3;

/** Whether the cache holds every shelf the first screen draws, so `CatalogPreview` can stand in. */
export function catalogPreviewReady(shelves: Record<string, ShelfState>): boolean {
  return PREVIEW_SHELVES.every((shelf) => shelves[shelf.id]?.status === 'ready');
}

type CatalogPreviewProps = {
  shelves: Record<string, ShelfState>;
  onOpen: (id: number) => void;
  onViewAll: (shelf: CatalogShelf) => void;
};

/** Free Books' first screen from cached shelves, while the drawer rises. See `ShelvesPreview`. */
export function CatalogPreview({ shelves, onOpen, onViewAll }: CatalogPreviewProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const ghost = tokens['--color-surface-tertiary'];
  const preview: PreviewShelf[] = PREVIEW_SHELVES.map((shelf) => {
    const state = shelves[shelf.id];
    const books = state?.status === 'ready' ? state.books.slice(0, PREVIEW_TILES) : [];
    return {
      key: shelf.id,
      title: shelf.label,
      onViewAll: () => onViewAll(shelf),
      tiles: books.map((book) => (
        <BookTile
          key={book.id}
          book={book}
          width={SHELF_TILE_WIDTH}
          mutedForeground={muted}
          surfaceTertiary={ghost}
          titleLines={1}
          onPress={onOpen}
        />
      )),
    };
  });
  return <ShelvesPreview shelves={preview} />;
}
