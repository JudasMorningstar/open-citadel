import React from 'react';
import { ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { PlainRowFade } from '@/components/scroll-fades';
import { SHELF_ROW_PADDING, ShelfGap, ShelfPageContext } from '@/components/shelf-parts';
import { useScrollMotion } from '@/hooks/use-scroll-motion';
import { useStagedCount } from '@/hooks/use-staged-count';

/** A whole row's tiles: the ones on screen at once, then a step at a time. */
const FIRST_TILES = 3;
const TILE_STEP = 3;
/** How close to an edge counts as at it, in points. */
const EDGE_SLACK = 1;

type WholeShelfRowProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderTile: (item: T) => React.ReactElement;
};

/**
 * A short row, drawn whole in a plain scroller.
 *
 * A list earns its keep on a long row. On a short one it only costs: it
 * builds each tile as it scrolls into view, which is a stutter the first time
 * a shelf is swiped, and it hands a tile scrolled away to the next one, so a
 * fast swipe showed tiles vanishing and coming back. Ten tiles are cheap to
 * keep.
 *
 * It is the scroller it will always be from its first frame, with the tiles
 * on screen in it, and the rest are added behind them a few at a time
 * (`useStagedCount`). Nothing is swapped for anything: an earlier version
 * opened as a plain row and became a scroller a moment later, and that moment
 * was a shelf that could not be swiped, then two rows drawn over each other.
 *
 * The rest wait for the page to finish arriving and while it is being
 * scrolled (`ShelfPageContext`), unless it is this row being swiped, which is
 * the one row that needs them.
 */
export function WholeShelfRow<T>({ items, keyOf, renderTile }: WholeShelfRowProps<T>) {
  const { ready, moving, onRowMotion } = React.useContext(ShelfPageContext);
  const [swiping, setSwiping] = React.useState(false);
  const report = React.useCallback(
    (now: boolean) => {
      setSwiping(now);
      onRowMotion(now);
    },
    [onRowMotion],
  );
  const motion = useScrollMotion(report);
  const count = useStagedCount(items.length, FIRST_TILES, TILE_STEP, !ready || (moving && !swiping));

  // Which edges have tiles past them. A row opens at its start, with more to
  // the right if there is more than fits.
  const [edges, setEdges] = React.useState({ start: false, end: items.length > 2 });
  const onScroll = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const start = contentOffset.x > EDGE_SLACK;
    const end = contentOffset.x + layoutMeasurement.width < contentSize.width - EDGE_SLACK;
    setEdges((current) => (current.start === start && current.end === end ? current : { start, end }));
  }, []);

  return (
    <PlainRowFade start={edges.start} end={edges.end}>
      <ScrollView
        horizontal
        {...motion}
        onScroll={onScroll}
        scrollEventThrottle={64}
        contentContainerStyle={SHELF_ROW_PADDING}
        showsHorizontalScrollIndicator={false}
      >
        {items.slice(0, count).map((item, index) => (
          <React.Fragment key={keyOf(item)}>
            {index > 0 ? <ShelfGap /> : null}
            {renderTile(item)}
          </React.Fragment>
        ))}
      </ScrollView>
    </PlainRowFade>
  );
}
