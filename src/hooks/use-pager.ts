import React from 'react';
import { useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

/**
 * A full-width horizontal pager's state: which page is showing, and the one
 * correction the native pager needs when its list shrinks.
 *
 * The page width, the scrollTo math and the index math all derive from the
 * one reactive window width; a stale snapshot desyncs scrollTo.
 *
 * The index is taken when a swipe settles, not on every scroll frame. It only
 * feeds the dots, which have nothing to say until a page has actually
 * settled, and `onScroll` would render the host screen sixty times a second on
 * a screen that is also hosting the hub's own gesture.
 */
export function usePager(count: number) {
  const { width } = useWindowDimensions();
  const ref = React.useRef<ScrollView>(null);
  // Ground truth about the pager: the last page it reported settling on.
  const [reported, setReported] = React.useState(0);

  /*
   * The page actually shown, clamped where it is READ. The list shrinks on
   * its own (the item you were on is finished, archived or deleted), and that
   * does not make the pager's report wrong, it makes it out of range. Deriving
   * the valid index keeps those two facts apart, and there is never a frame
   * drawn with an index past the end of the list.
   */
  const page = Math.min(reported, Math.max(0, count - 1));

  // The pager still has to be TOLD. It holds its offset natively and nothing
  // about the list shrinking moves it. Also re-runs when the window width
  // changes (rotation, foldables), so the offset follows the page width.
  React.useEffect(() => {
    if (reported <= page) return;
    ref.current?.scrollTo({ x: page * width, animated: true });
  }, [reported, page, width]);

  const onSettle = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      setReported(Math.round(event.nativeEvent.contentOffset.x / width)),
    [width],
  );

  return { ref, width, page, onSettle };
}
