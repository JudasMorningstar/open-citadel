import React from "react";

import { BookTile } from "@/features/library/components/book-tile";
import type { TileBook } from "@/features/library/utils/tile-book";


type BookGridCardProps<B extends TileBook> = {
  book: B;
  /** Column width in dp, derived once by the screen from the live window. */
  width: number;
  /** Resolved `--color-muted-foreground`, passed down so a grid of these
   *  shares one `useCSSVariable` subscription instead of one per card. */
  mutedForeground: string | undefined;
  /** Resolved `--color-surface-tertiary`. */
  surfaceTertiary: string | undefined;
  onPress: (bookId: B['id']) => void;
  onLongPress?: (book: B) => void;
};

/**
 * One book in a 2-column library grid (the "View All" section screen and a
 * collection).
 *
 * A thin name over `BookTile`, which is the one place that decides what a book
 * looks like. Kept as its own export because the grid screens and the skeleton
 * that stands in for them are written in terms of it.
 */
export function BookGridCard<B extends TileBook>(props: BookGridCardProps<B>) {
  return <BookTile {...props} titleLines={2} />;
}
