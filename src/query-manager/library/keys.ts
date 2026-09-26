/** Book library queries: what is read from SQLite beyond the books store itself. */
export const libraryKeys = {
  all: ['library'] as const,
  collectionBooks: (collectionId: string) => [...libraryKeys.all, 'collection', collectionId, 'books'] as const,
};
