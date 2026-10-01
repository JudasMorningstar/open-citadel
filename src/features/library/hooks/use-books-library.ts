import { useRouter } from 'expo-router';
import React from 'react';

import { prefetchFirstShelves } from '@/features/free-books/hooks/use-catalog-shelves';
import { useLibraryBoot } from '@/features/library/hooks/use-library-boot';
import { useOpenReader } from '@/features/library/hooks/use-open-reader';
import { addBooksMenu, type AddBooksKey } from '@/features/library/utils/add-books-menu';
import { pickBooksDirectory } from '@/services/book-sync';
import {
  useAllBooks,
  useArchivedBooks,
  useBooksStore,
  useCurrentlyReading,
  useFavoriteBooks,
  useQueuedBooks,
  useSyncRunning,
} from '@/stores/books';
import { useCollectionsStore } from '@/stores/collections';

export type BookSection = 'reading' | 'queue' | 'favorites' | 'archived' | 'collections' | 'all';

/** What the books side draws: the boot skeleton, the setup prompt, or the shelves. */
export type BooksLibraryView = 'booting' | 'setup' | 'library';

const IS_IOS = process.env.EXPO_OS === 'ios';
/** Module level: the same options every render, so the button's menu is not rebuilt. */
const ADD_OPTIONS = addBooksMenu(process.env.EXPO_OS);
/** All Books on the home page is a taste; its "View all" has the rest. */
const ALL_BOOKS_PREVIEW = 20;

/**
 * Everything the books side of the Library needs: its shelves, which view to
 * show, and what its buttons do.
 *
 * Selectors, never a bare `useBooksStore()`. That re-ran the whole Library
 * (every shelf, every card) on every write the store made, and a scan runs at
 * every launch on the screen the app opens on: 18 full renders over one
 * launch scan of nine files, measured on device. The scan comes through as a
 * BOOLEAN; its counters tick several times a second and only `SyncIndicator`
 * reads them, which it does for itself. Actions are read from `getState()` at
 * call time, so nothing here re-renders for them.
 */
export function useBooksLibrary() {
  const router = useRouter();
  const booted = useLibraryBoot();
  const openReader = useOpenReader();
  const booksDirectoryUri = useBooksStore((s) => s.booksDirectoryUri);
  const isLoading = useBooksStore((s) => s.isLoading);
  const syncRunning = useSyncRunning();
  const collections = useCollectionsStore((s) => s.collections);

  const reading = useCurrentlyReading();
  const queued = useQueuedBooks();
  const archived = useArchivedBooks();
  const favorites = useFavoriteBooks();
  const all = useAllBooks();
  // A fresh array every render is a new prop for the memo'd shelf.
  const allPreview = React.useMemo(() => all.slice(0, ALL_BOOKS_PREVIEW), [all]);

  /*
   * iOS always has an owned folder, so it gates on whether any books exist.
   * A launch scan is background work, not a reason to swap the shelves for
   * Get Started for a moment: `booted` already proves the first read
   * finished, and if a scan finds a book, `all` changes and this hands over to
   * the shelves by itself. Android gates on whether a folder has been picked.
   */
  const needsSetup = IS_IOS ? all.length === 0 : !booksDirectoryUri && !isLoading;
  const view: BooksLibraryView = !booted ? 'booting' : needsSetup ? 'setup' : 'library';

  /*
   * A pull says "look again", and it is answered whether or not there is
   * anything to find: the same notice the launch scan raises, so a pull that
   * turns up nothing says "No new books" rather than opening a gap, closing
   * it and leaving the reader to guess.
   */
  const pullSync = React.useCallback(() => void useBooksStore.getState().syncBooks({ notify: true }), []);

  // iOS picks EPUBs with the document picker and copies them into the owned
  // folder; Android points the app at a folder once.
  const addBooks = React.useCallback(() => void useBooksStore.getState().importBooks(), []);
  const openFreeBooks = React.useCallback(() => {
    prefetchFirstShelves();
    router.push('/free-books/explore');
  }, [router]);
  const onAddBooks = React.useCallback(
    (key: AddBooksKey) => (key === 'files' ? addBooks() : openFreeBooks()),
    [addBooks, openFreeBooks],
  );
  const setUp = React.useCallback(async () => {
    if (IS_IOS) return addBooks();
    const uri = await pickBooksDirectory();
    if (uri) await useBooksStore.getState().setDirectoryUri(uri);
  }, [addBooks]);

  const viewAll = React.useMemo(() => {
    const open = (section: BookSection) => () => router.push(`/section/${section}` as any);
    return {
      reading: open('reading'),
      queue: open('queue'),
      favorites: open('favorites'),
      archived: open('archived'),
      collections: open('collections'),
      all: open('all'),
    } satisfies Record<BookSection, () => void>;
  }, [router]);
  const openCollection = React.useCallback((id: string) => router.push(`/collection/${id}` as any), [router]);

  return {
    view,
    addOptions: ADD_OPTIONS,
    syncRunning,
    shelves: { reading, queued, favorites, archived, allPreview, hasBooks: all.length > 0 },
    collections,
    openReader,
    openCollection,
    viewAll,
    pullSync,
    onAddBooks,
    openFreeBooks,
    setUp,
  };
}

export type BooksLibraryState = ReturnType<typeof useBooksLibrary>;
