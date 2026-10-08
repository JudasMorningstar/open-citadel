import React from 'react';

import { BooksLibrary } from '@/features/library/components/books-library';
import { useBookSheets } from '@/features/library/hooks/use-book-sheets';
import { useBooksLibrary } from '@/features/library/hooks/use-books-library';
import { useLibraryFilled } from '@/features/library/hooks/use-library-filled';
import { useNewCollection } from '@/features/library/hooks/use-new-collection';
import { useSettledAfter } from '@/navigation/use-settled-after';

type BooksPageProps = {
  /** Room kept free at the bottom for the mini player, when one is showing. */
  bottomChrome: number;
  /** The books store has been read (the Library shell's boot). */
  booted: boolean;
  /** How long to hold the skeleton for the switch's fade; zero when the app opened here. */
  settleMs: number;
};

/**
 * The books side of the Library, wired. Its own component rather than hooks
 * called in `LibraryPage`, so a books store write re-renders this side and
 * not the header, the switch and the podcasts side with it.
 */
export function BooksPage({ bottomChrome, booted, settleMs }: BooksPageProps) {
  const landed = useSettledAfter(settleMs);
  const library = useBooksLibrary({ booted, landed });
  useLibraryFilled(library.view !== 'booting');
  const sheets = useBookSheets();
  const newCollection = useNewCollection();
  return <BooksLibrary library={library} sheets={sheets} newCollection={newCollection} bottomChrome={bottomChrome} />;
}
