import React from 'react';
import { View } from 'react-native';

import { layout } from '@/constants/theme';

const GAP = { width: 16 };
/** The row's inset, the list's and the still row's alike. */
export const SHELF_ROW_PADDING = { paddingHorizontal: layout.gutter };

/** The space between two tiles. */
export function ShelfGap() {
  return <View style={GAP} />;
}

/**
 * What a shelf's row needs to know about the page it is on: whether the page
 * has finished arriving, whether it is being scrolled (by its own scroller or
 * by one of its rows), and the way for a row to say that it is.
 *
 * Building tiles shares a thread with a drawer rising and with a scroll, so
 * nothing is built during either. Outside a `ShelfStack` nothing is listening
 * and nothing is held.
 */
export const ShelfPageContext = React.createContext<{
  ready: boolean;
  moving: boolean;
  onRowMotion: (moving: boolean) => void;
}>({
  ready: true,
  moving: false,
  onRowMotion: () => undefined,
});
