import React from 'react';
import { View } from 'react-native';

import { TransitionScrollView } from '@/components/navigation/transition-scroll';
import { PageFade } from '@/components/scroll-fades';
import { ShelfPageContext } from '@/components/shelf-parts';
import { useShelfReach } from '@/hooks/use-shelf-reach';
import { useStagedCount } from '@/hooks/use-staged-count';

type ShelfStackProps<T> = {
  shelves: readonly T[];
  keyOf: (shelf: T) => string;
  renderShelf: (shelf: T) => React.ReactElement;
  /** How many are drawn at once: what the page shows before it is scrolled. */
  first: number;
  /** The page has finished arriving. Until then nothing more is built. */
  ready?: boolean;
  /**
   * Draw only as far as the page has been scrolled, for shelves that cost a
   * request each. Off, every shelf is drawn, a step at a time.
   */
  lazy?: boolean;
  /** Told how many shelves are drawn, each time that grows. */
  onDrawn?: (count: number) => void;
  bottomPadding: number;
  /** Under the last shelf, once the last shelf is there. */
  footer?: React.ReactNode;
};

/**
 * An Explore page's shelves: a column of horizontal rows in a plain scroller.
 *
 * Not a list. A dozen shelves is too few to be worth recycling, and recycling
 * is what it cost: a shelf scrolled away was handed to the next genre and
 * rebuilt, so a fast scroll showed rows vanishing and coming back, and coming
 * back to a shelf lost where it had been scrolled to. A list also drew its
 * first screens in several passes, seven shelves deep, and the page's
 * placeholder stayed up over a list that could not answer a swipe until the
 * last pass was done: two seconds and more on an A33.
 *
 * So the shelves the page opens on are drawn at once, in the real scroller,
 * which can be scrolled from its first frame, each with only the tiles on
 * screen (`WholeShelfRow`). Once the page has landed the rest follow, one at a
 * time when the thread is idle (`useStagedCount`), held back while the page
 * is being scrolled unless the scroll is about to run out of shelves
 * (`useShelfReach`). Once drawn a shelf stays.
 */
export function ShelfStack<T>({
  shelves,
  keyOf,
  renderShelf,
  first,
  ready = true,
  lazy = false,
  onDrawn,
  bottomPadding,
  footer,
}: ShelfStackProps<T>) {
  const { reach, moving: scrolling, onScroll, onShelfLayout, motion } = useShelfReach(first);
  // A row being swiped is the page moving too: nothing else is built under it.
  const [rowMoving, setRowMoving] = React.useState(false);
  const moving = scrolling || rowMoving;
  const page = React.useMemo(() => ({ ready, moving, onRowMotion: setRowMoving }), [ready, moving]);
  // A shelf built while the page is moving is a frame or two of that scroll,
  // so it waits for the scroll to rest, unless the scroll is about to arrive
  // at where the shelves stop.
  const [held, setHeld] = React.useState(!ready);
  const staged = useStagedCount(shelves.length, first, 1, held);
  const shouldHold = !ready || (moving && staged >= reach);
  if (shouldHold !== held) setHeld(shouldHold);
  const count = lazy ? Math.min(staged, reach) : staged;
  React.useEffect(() => {
    onDrawn?.(count);
  }, [count, onDrawn]);

  return (
    <ShelfPageContext.Provider value={page}>
      <PageFade>
        <TransitionScrollView
          {...motion}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerClassName="pt-4"
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
        >
          {shelves.slice(0, count).map((shelf, index) => (
            <View key={keyOf(shelf)} onLayout={index === 0 ? onShelfLayout : undefined}>
              {renderShelf(shelf)}
            </View>
          ))}
          {count >= shelves.length ? footer : null}
        </TransitionScrollView>
      </PageFade>
    </ShelfPageContext.Provider>
  );
}
