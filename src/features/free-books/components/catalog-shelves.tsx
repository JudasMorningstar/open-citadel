import React from 'react';
import type { ViewToken } from 'react-native';

import { TransitionFlashList } from '@/components/navigation/transition-scroll';
import { PageFade } from '@/components/scroll-fades';
import { LIST_DRAW_DISTANCE } from '@/constants/theme';
import { CatalogShelf } from '@/features/free-books/components/catalog-shelf';
import { FreeBooksNotice } from '@/features/free-books/components/free-books-notice';
import type { ShelfState } from '@/features/free-books/hooks/use-catalog-shelves';
import { CATALOG_SHELVES, type CatalogShelf as Shelf } from '@/services/gutenberg/shelves';

const shelfKey = (shelf: Shelf) => shelf.id;
/** A shelf counts as seen once any of it is on screen. */
const VIEWABILITY = { itemVisiblePercentThreshold: 1 };

type CatalogShelvesProps = {
  shelves: Record<string, ShelfState>;
  bottomPadding: number;
  onViewableItemsChanged: (info: { viewableItems: ViewToken<Shelf>[] }) => void;
  onOpen: (id: number) => void;
  onViewAll: (shelf: Shelf) => void;
};

/**
 * Project Gutenberg's shelves, one row each, with where the books come from
 * at the foot. A FlashList of shelves, each a horizontal FlashList of tiles,
 * as on the podcasts' Explore, so only what is near the screen is built.
 */
export const CatalogShelves = React.memo(function CatalogShelves({ shelves, bottomPadding, onViewableItemsChanged, onOpen, onViewAll }: CatalogShelvesProps) {
  const renderItem = React.useCallback(
    ({ item }: { item: Shelf }) => <CatalogShelf shelf={item} state={shelves[item.id]} onOpen={onOpen} onViewAll={onViewAll} />,
    [onOpen, onViewAll, shelves],
  );

  return (
    <PageFade>
      <TransitionFlashList
        data={CATALOG_SHELVES}
        keyExtractor={shelfKey}
        renderItem={renderItem}
        extraData={shelves}
        drawDistance={LIST_DRAW_DISTANCE}
        viewabilityConfig={VIEWABILITY}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<FreeBooksNotice />}
      />
    </PageFade>
  );
});
