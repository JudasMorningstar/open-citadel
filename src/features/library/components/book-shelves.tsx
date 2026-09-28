import React from 'react';

import { PagedRow } from '@/components/paged-row';
import { ShelfSection } from '@/components/shelf-section';
import { ArchivedCards } from '@/features/library/components/archived-card';
import { BookQueue } from '@/features/library/components/book-queue';
import { CollectionGrid } from '@/features/library/components/collection-grid';
import { CurrentlyReadingCard } from '@/features/library/components/currently-reading-card';
import { Favorites } from '@/features/library/components/favorites';
import type { BookSection, BooksLibraryState } from '@/features/library/hooks/use-books-library';
import type { Book } from '@/stores/books';
import type { CollectionWithCount } from '@/stores/collections';

type BookShelvesProps = {
  shelves: BooksLibraryState['shelves'];
  collections: CollectionWithCount[];
  viewAll: Record<BookSection, () => void>;
  onOpen: (bookId: string) => void;
  onMenu: (book: Book) => void;
  onOpenCollection: (collectionId: string) => void;
  onNewCollection: () => void;
};

const bookKey = (book: Book) => book.id;

/**
 * The books side's shelves, in the order a reader reaches for them. A shelf
 * with nothing on it is left out, except Collections, which is also where a
 * new collection is made.
 */
export function BookShelves({
  shelves,
  collections,
  viewAll,
  onOpen,
  onMenu,
  onOpenCollection,
  onNewCollection,
}: BookShelvesProps) {
  const renderReading = (book: Book) => <CurrentlyReadingCard book={book} onPress={onOpen} onLongPress={onMenu} />;

  return (
    <>
      {shelves.reading.length > 0 ? (
        <ShelfSection title="Currently Reading" onViewAll={viewAll.reading} capped={false}>
          <PagedRow items={shelves.reading} keyOf={bookKey} renderPage={renderReading} />
        </ShelfSection>
      ) : null}
      {shelves.queued.length > 0 ? (
        <ShelfSection title="Queue" onViewAll={viewAll.queue}>
          <BookQueue books={shelves.queued} onBookPress={onOpen} onBookLongPress={onMenu} />
        </ShelfSection>
      ) : null}
      {shelves.favorites.length > 0 ? (
        <ShelfSection title="Favorites" onViewAll={viewAll.favorites}>
          <Favorites books={shelves.favorites} onBookPress={onOpen} onBookLongPress={onMenu} />
        </ShelfSection>
      ) : null}
      {shelves.archived.length > 0 ? (
        <ShelfSection title="Have Read" onViewAll={viewAll.archived}>
          <ArchivedCards books={shelves.archived} onBookPress={onOpen} onBookLongPress={onMenu} />
        </ShelfSection>
      ) : null}
      <ShelfSection title="Collections" onViewAll={viewAll.collections}>
        <CollectionGrid collections={collections} onPress={onOpenCollection} onCreateCollection={onNewCollection} />
      </ShelfSection>
      {shelves.hasBooks ? (
        <ShelfSection title="All Books" onViewAll={viewAll.all}>
          <BookQueue books={shelves.allPreview} onBookPress={onOpen} onBookLongPress={onMenu} />
        </ShelfSection>
      ) : null}
    </>
  );
}
