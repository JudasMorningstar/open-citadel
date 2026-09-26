import React from 'react';

import { BooksLibrary } from '@/features/library/components/books-library';
import { useBookSheets } from '@/features/library/hooks/use-book-sheets';
import { useBooksLibrary } from '@/features/library/hooks/use-books-library';
import { useNewCollection } from '@/features/library/hooks/use-new-collection';

type BooksPageProps = {
  /** Room kept free at the bottom for the mini player, when one is showing. */
  bottomChrome: number;
};

/**
 * The books side of the Library, wired. Its own component rather than hooks
 * called in `LibraryPage`, so a books store write re-renders this side and
 * not the header, the switch and the podcasts side with it.
 */
export function BooksPage({ bottomChrome }: BooksPageProps) {
  const library = useBooksLibrary();
  const sheets = useBookSheets();
  const newCollection = useNewCollection();
  return <BooksLibrary library={library} sheets={sheets} newCollection={newCollection} bottomChrome={bottomChrome} />;
}
