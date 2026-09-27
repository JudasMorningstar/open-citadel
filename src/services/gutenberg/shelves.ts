import type { CatalogSort } from 'samwell-shared';

/**
 * The shelves Explore draws from Project Gutenberg, in its order.
 *
 * Each is its most-read books, its newest, or one of the "Category:"
 * bookshelves its catalogue groups books into, most-read first. The topic is
 * the bookshelf's name, matched as part of a name, exactly as the catalogue
 * holds it. Led by what a reader of this app is most likely to reach for (the
 * classics, philosophy, the mind, lives, history) and then the fiction.
 */
export type CatalogShelf = {
  /** Stable, and what a route carries. */
  id: string;
  label: string;
  topic?: string;
  sort?: CatalogSort;
};

const category = (id: string, label: string, name: string): CatalogShelf => ({
  id,
  label,
  topic: `Category: ${name}`,
});

export const CATALOG_SHELVES: CatalogShelf[] = [
  { id: 'popular', label: 'Most read', sort: 'popular' },
  category('classics', 'Classics', 'Classics of Literature'),
  category('philosophy', 'Philosophy', 'Philosophy & Ethics'),
  category('psychology', 'Psychology', 'Psychiatry/Psychology'),
  category('biographies', 'Lives', 'Biographies'),
  category('essays', 'Essays and letters', 'Essays, Letters & Speeches'),
  category('history-ancient', 'The ancient world', 'History - Ancient'),
  category('history-modern', 'The modern world', 'History - Modern (1750+)'),
  category('religion', 'Religion and spirituality', 'Religion/Spirituality'),
  category('politics', 'Politics', 'Politics'),
  category('economics', 'Economics', 'Economics'),
  category('poetry', 'Poetry', 'Poetry'),
  category('adventure', 'Adventure', 'Adventure'),
  category('mystery', 'Mystery and crime', 'Crime, Thrillers and Mystery'),
  category('fantasy', 'Science fiction and fantasy', 'Science-Fiction & Fantasy'),
  { id: 'latest', label: 'Just added', sort: 'newest' },
];

export function findShelf(id: string | undefined): CatalogShelf {
  return CATALOG_SHELVES.find((shelf) => shelf.id === id) ?? CATALOG_SHELVES[0];
}
