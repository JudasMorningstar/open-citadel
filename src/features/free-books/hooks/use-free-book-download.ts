import { useMutation } from '@tanstack/react-query';
import React from 'react';

import { showToast } from '@/components/toast/toast-provider';
import { downloadCatalogBook } from '@/services/gutenberg/download';
import type { CatalogBookDetail } from '@/services/gutenberg/records';
import { gutenbergBookIds, useBooksStore, useSyncRunning } from '@/stores/books';

const TOAST_KEY = 'free-book-download';

/**
 * How long after a scan ends before a book it did not bring in counts as
 * missed: the shelves reload after the scan reports it is done, and a queued
 * follow-up scan takes a moment to start.
 */
const SCAN_SETTLE_MS = 2000;

/**
 * Downloading one free book into the library folder. A mutation, so its
 * pending state is the button's spinner and a second press does nothing.
 * Closing Android's folder picker is the reader's choice and says nothing.
 *
 * `downloaded` holds from the moment the file is in the folder until the
 * Library has the book (`inLibrary`). The download returns once the scan has
 * started, so if the scans then settle without the book, it could not be read
 * in: the page offers the download again, and trying again does not fetch the
 * file twice (see `downloadBooksIntoLibrary`).
 */
export function useFreeBookDownload(book: CatalogBookDetail | undefined, inLibrary: boolean) {
  const syncRunning = useSyncRunning();
  const mutation = useMutation({
    mutationFn: () => {
      if (!book) throw new Error('The book has not loaded yet.');
      return downloadCatalogBook({ id: book.id, title: book.title });
    },
    onError: () => showToast({ key: TOAST_KEY, message: 'The download did not finish. Try again in a moment.' }),
  });

  const added = mutation.data === 'added';
  const { reset } = mutation;
  const gutenbergId = book?.id;
  React.useEffect(() => {
    if (!added || inLibrary || syncRunning || gutenbergId == null) return;
    const timer = setTimeout(() => {
      const state = useBooksStore.getState();
      if (state.sync.status === 'running' || gutenbergBookIds(state.books).has(gutenbergId)) return;
      reset();
      showToast({ key: TOAST_KEY, message: 'The Library could not read that book in. Try the download again.' });
    }, SCAN_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [added, gutenbergId, inLibrary, reset, syncRunning]);

  return {
    download: () => {
      if (!mutation.isPending) mutation.mutate();
    },
    downloading: mutation.isPending,
    downloaded: added,
  };
}
