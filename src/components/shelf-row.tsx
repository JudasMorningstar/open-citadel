import { FlashList } from '@shopify/flash-list';
import React from 'react';

import { RowFade } from '@/components/scroll-fades';
import { SHELF_ROW_PADDING, ShelfGap } from '@/components/shelf-parts';
import { WholeShelfRow } from '@/components/whole-shelf-row';

/**
 * The longest row that is drawn whole rather than as a list. An Explore shelf
 * is ten or twelve tiles, with the rest behind its "View all".
 */
const WHOLE_ROW_MAX = 12;

type ShelfRowProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderTile: (item: T) => React.ReactElement;
  extraData?: unknown;
};

/**
 * A shelf's row of tiles: drawn whole when it is short (`WholeShelfRow`), and
 * as a horizontal list that draws only the tiles on screen when it is long.
 */
export function ShelfRow<T>({ items, keyOf, renderTile, extraData }: ShelfRowProps<T>) {
  const renderItem = React.useCallback(({ item }: { item: T }) => renderTile(item), [renderTile]);
  if (items.length <= WHOLE_ROW_MAX) return <WholeShelfRow items={items} keyOf={keyOf} renderTile={renderTile} />;
  return (
    <RowFade>
      <FlashList
        horizontal
        data={items}
        keyExtractor={keyOf}
        renderItem={renderItem}
        extraData={extraData}
        ItemSeparatorComponent={ShelfGap}
        contentContainerStyle={SHELF_ROW_PADDING}
        showsHorizontalScrollIndicator={false}
      />
    </RowFade>
  );
}
