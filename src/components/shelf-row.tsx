import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { View } from 'react-native';

import { RowFade } from '@/components/scroll-fades';
import { layout } from '@/constants/theme';

const GAP = { width: 16 };
/** The row's inset. Shared with `ShelvesPreview`, which has to lay its rows out the same. */
export const SHELF_ROW_PADDING = { paddingHorizontal: layout.gutter };

/** The space between two tiles. Shared with `ShelvesPreview`, as above. */
export function ShelfGap() {
  return <View style={GAP} />;
}

type ShelfRowProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderTile: (item: T) => React.ReactElement;
  /** Changes that should redraw tiles without new items (a show becoming followed). */
  extraData?: unknown;
};

/**
 * A shelf's row of tiles, scrolling sideways.
 *
 * A virtualized list, not a scroll view with every tile mapped into it: a
 * scroll view builds all of its tiles before it can draw, and a page of
 * shelves built that way cost the frames the screen needed to start moving.
 * FlashList builds the tiles that are on screen (and a little past the
 * edge), and inside a vertical FlashList it tells the parent when its layout
 * is done, so the page never draws a row at the wrong height.
 */
export function ShelfRow<T>({ items, keyOf, renderTile, extraData }: ShelfRowProps<T>) {
  const renderItem = React.useCallback(({ item }: { item: T }) => renderTile(item), [renderTile]);
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
