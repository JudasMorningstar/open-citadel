/**
 * What a book tile needs to draw a book: a library book, or one from Project
 * Gutenberg's catalog that is not on the device yet.
 */
export type TileBook = {
  id: string | number;
  title: string;
  author: string | null;
  coverUrl: string | null;
  /**
   * A library book's file. `null` is a book a scan is still bringing in,
   * drawn with the sync badge; a catalog book has none at all.
   */
  filePath?: string | null;
};
