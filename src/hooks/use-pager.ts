import React from 'react';
import { useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

/**
 * A full-width horizontal pager's state: which page is showing, and the two
 * corrections the native pager needs: when its list shrinks, and when a new
 * item leads it (`leadKey`).
 *
 * The page width, the scrollTo math and the index math all derive from the
 * one reactive window width; a stale snapshot desyncs scrollTo.
 *
 * The index is taken when a swipe settles, not on every scroll frame. It only
 * feeds the dots, which have nothing to say until a page has actually
 * settled, and `onScroll` would render the host screen sixty times a second on
 * a screen that is also hosting the hub's own gesture.
 */
export function usePager(count: number, leadKey: string | null = null) {
  const { width } = useWindowDimensions();
  const ref = React.useRef<ScrollView>(null);
  // Ground truth about the pager: the last page it reported settling on.
  const [reported, setReported] = React.useState(0);

  /*
   * Back to the first page when a different item leads the list. These lists
   * put what was read or played last first, so coming back from the second
   * book moves that book to the front; staying on page two would then show a
   * book nobody chose. Reset while rendering (React's pattern for state that
   * follows a prop), so no frame is drawn on the wrong page.
   */
  const [lead, setLead] = React.useState(leadKey);
  if (lead !== leadKey) {
    setLead(leadKey);
    setReported(0);
  }
  React.useEffect(() => {
    ref.current?.scrollTo({ x: 0, animated: false });
  }, [lead]);

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
