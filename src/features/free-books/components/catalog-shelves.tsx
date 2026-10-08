import React from 'react';

import { ShelfStack } from '@/components/shelf-stack';
import { CatalogShelf } from '@/features/free-books/components/catalog-shelf';
import { FreeBooksNotice } from '@/features/free-books/components/free-books-notice';
import type { ShelfState } from '@/features/free-books/utils/catalog-preview';
import { CATALOG_FIRST_SHELVES } from '@/features/free-books/utils/catalog-preview';
import { CATALOG_SHELVES, type CatalogShelf as Shelf } from '@/services/gutenberg/shelves';

const shelfKey = (shelf: Shelf) => shelf.id;
/** A shelf counts as seen once any of it is on screen. */

type CatalogShelvesProps = {
  shelves: Record<string, ShelfState>;
  bottomPadding: number;
  /** The drawer has finished rising. */
  ready: boolean;
  /** Told how many shelves are drawn, so only those are asked for. */
  onDrawn: (count: number) => void;
  onOpen: (id: number) => void;
  onViewAll: (shelf: Shelf) => void;
};

/**
 * Project Gutenberg's shelves, one row each, with where the books come from
 * at the foot. A FlashList of shelves, each a horizontal FlashList of tiles,
 * as on the podcasts' Explore, so only what is near the screen is built.
 */
export const CatalogShelves = React.memo(function CatalogShelves({ shelves, bottomPadding, ready, onDrawn, onOpen, onViewAll }: CatalogShelvesProps) {
  const renderShelf = React.useCallback(
    (shelf: Shelf) => <CatalogShelf shelf={shelf} state={shelves[shelf.id]} onOpen={onOpen} onViewAll={onViewAll} />,
    [onOpen, onViewAll, shelves],
  );

  return (
    <ShelfStack
      shelves={CATALOG_SHELVES}
      keyOf={shelfKey}
      renderShelf={renderShelf}
      first={CATALOG_FIRST_SHELVES}
      ready={ready}
      // A shelf here is a request, so one is only drawn as the page nears it.
      lazy
      onDrawn={onDrawn}
      bottomPadding={bottomPadding}
      footer={<FreeBooksNotice />}
    />
  );
});
