/**
 * Putting a Project Gutenberg book into the library folder: the one folder
 * the Library scans, on either platform.
 *
 * Shared by Samwell's onboarding tool (`download_free_books`) and the free
 * books page, so both land a book the same way and name it the same way.
 *
 * The file is Gutenberg's, byte for byte. Its license header stays in it,
 * which is what Gutenberg's license asks of anyone passing its books on.
 */
import Constants from 'expo-constants';
import {
  EncodingType,
  StorageAccessFramework,
  cacheDirectory,
  createDownloadResumable,
  deleteAsync,
  getInfoAsync,
  moveAsync,
  readAsStringAsync,
  writeAsStringAsync,
} from 'expo-file-system/legacy';

import { OWNED_DIR, ensureOwnedDir } from '@/services/book-import';
import { queryClient } from '@/lib/query-client';
import { createCatalogBookQueryOptions } from '@/query-manager/gutenberg';
import { GUTENBERG_ORIGIN, canDownload, epubFileName, gutenbergIdFromUri } from '@/services/gutenberg/records';
import { LIBRARY_FOLDER_NAME, MAX_BASE64_BYTES } from '@/services/library-setup';
import { useBooksStore } from '@/stores/books';

export type DownloadFailure = { id: number; error: string };

/** How far a book's file has come down, 0..1. */
export type DownloadProgress = (fraction: number) => void;

/**
 * The app, its version, and where Project Gutenberg can reach whoever runs it:
 * its terms ask applications for "a proper user-agent" with "a contact
 * address".
 */
const DOWNLOAD_OPTIONS = {
  headers: { 'User-Agent': `OpenCitadel/${Constants.expoConfig?.version ?? '1'} (+https://www.open-citadel.online)` },
};

/**
 * The library folder, made if it is not there yet.
 *
 * Downloading free books has to work for somebody who said they had no books
 * and therefore never ran `setUpLibrary`. On iOS that is just the owned
 * folder. On Android it means asking for a folder after all, which is why the
 * download tool needs approval too: it can open a system picker.
 */
async function ensureLibraryFolder(): Promise<string | null> {
  const store = useBooksStore.getState();

  if (process.env.EXPO_OS !== 'android') {
    await ensureOwnedDir();
    await store.initLibrary();
    return OWNED_DIR;
  }

  const existing = store.booksDirectoryUri;
  if (existing) return existing;

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) return null;

  const folderUri = await StorageAccessFramework.makeDirectoryAsync(permission.directoryUri, LIBRARY_FOLDER_NAME);
  await store.setDirectoryUri(folderUri, { scan: false });
  return folderUri;
}

/** Where a download waits until it is known to be a book: never the scanned folder. */
function stagingPath(fileName: string): string {
  return `${cacheDirectory}${fileName}`;
}

/**
 * Whether this book's file is already in the folder, downloaded before but
 * perhaps not scanned in yet. Fetching it again would, on Android, add a
 * second copy named `(1)` that the scan would then import as another book.
 */
async function alreadyInFolder(folderUri: string, fileName: string, id: number): Promise<boolean> {
  if (!folderUri.startsWith('content://')) return (await getInfoAsync(`${folderUri}${fileName}`)).exists;
  const entries = await StorageAccessFramework.readDirectoryAsync(folderUri).catch(() => [] as string[]);
  return entries.some((uri) => gutenbergIdFromUri(uri) === id);
}

/**
 * Put a downloaded EPUB into the library folder.
 *
 * It always lands in the cache first and moves into the folder only once
 * Gutenberg has answered 200. The folder is what the Library scans, so an
 * error page written straight into it would become a broken book, and one the
 * app would then think was already downloaded.
 *
 * Two ways across, because the destination is two kinds of thing. A `file://`
 * folder takes a plain move. A SAF folder cannot be written to directly, so
 * the file is written across as base64.
 *
 * Progress is reported only when Gutenberg says how large the file is, which
 * its EPUBs always do.
 */
async function saveEpubTo(folderUri: string, fileName: string, sourceUrl: string, onProgress?: DownloadProgress): Promise<void> {
  const staging = stagingPath(fileName);
  try {
    const task = createDownloadResumable(sourceUrl, staging, DOWNLOAD_OPTIONS, (p) => {
      if (p.totalBytesExpectedToWrite > 0) onProgress?.(p.totalBytesWritten / p.totalBytesExpectedToWrite);
    });
    const result = await task.downloadAsync();
    if (!result || result.status !== 200) {
      throw new Error(result ? `Project Gutenberg answered ${result.status}.` : 'The download stopped.');
    }

    if (!folderUri.startsWith('content://')) {
      await moveAsync({ from: staging, to: `${folderUri}${fileName}` });
      return;
    }

    // Written across as base64, whole, so the same ceiling as moving a
    // reader's own books: past it, running out of memory kills the app.
    const info = await getInfoAsync(staging);
    if (!info.exists || info.size > MAX_BASE64_BYTES) {
      throw new Error('This book is too large to add here.');
    }
    const destUri = await StorageAccessFramework.createFileAsync(
      folderUri,
      fileName.replace(/\.epub$/i, ''),
      'application/epub+zip',
    );
    const contents = await readAsStringAsync(staging, { encoding: EncodingType.Base64 });
    await writeAsStringAsync(destUri, contents, { encoding: EncodingType.Base64 });
  } finally {
    await deleteAsync(staging, { idempotent: true }).catch(() => {});
  }
}

/**
 * The book's file, once the catalogue confirms it may be downloaded here.
 *
 * Asked of the catalogue for every download, from Explore and from Samwell's
 * onboarding tool alike, so `canDownload` is the one rule deciding what goes
 * on a reader's device. Usually already cached by the book's page.
 */
async function downloadableEpub(id: number): Promise<string> {
  const detail = await queryClient.fetchQuery(createCatalogBookQueryOptions(id));
  if (!canDownload(detail) || !detail.epubUrl?.startsWith(`${GUTENBERG_ORIGIN}/`)) {
    throw new Error('This book is not free to download here.');
  }
  return detail.epubUrl;
}

/**
 * Download books into the library folder. Does not scan it: onboarding scans
 * on its way out (`scanLibraryNow`), and the free books page asks for its own
 * scan (`downloadCatalogBook`).
 */
export async function downloadBooksIntoLibrary(
  books: { id: number; title: string }[],
  onProgress?: (id: number, fraction: number) => void,
): Promise<{ downloaded: string[]; failed: DownloadFailure[]; cancelled: boolean }> {
  const folderUri = await ensureLibraryFolder();
  if (!folderUri) return { downloaded: [], failed: [], cancelled: true };

  const downloaded: string[] = [];
  const failed: DownloadFailure[] = [];

  for (const book of books) {
    try {
      const fileName = epubFileName(book.title, book.id);
      if (!(await alreadyInFolder(folderUri, fileName, book.id))) {
        await saveEpubTo(folderUri, fileName, await downloadableEpub(book.id), (fraction) => onProgress?.(book.id, fraction));
      }
      downloaded.push(book.title);
    } catch (error) {
      failed.push({
        id: book.id,
        error: error instanceof Error ? error.message : 'The download failed.',
      });
    }
  }

  return { downloaded, failed, cancelled: false };
}

/**
 * One book from the free books page: downloaded into the folder, then the
 * folder scanned, so it arrives on the shelves without a pull. `cancelled` is
 * an Android reader closing the folder picker, which is their call and not an
 * error.
 *
 * Waits for the scan to have started, so the page can tell "the Library is
 * reading it in" from "the scan came and went without it".
 */
export async function downloadCatalogBook(
  book: { id: number; title: string },
  onProgress?: DownloadProgress,
): Promise<'added' | 'cancelled'> {
  const { failed, cancelled } = await downloadBooksIntoLibrary([book], (_id, fraction) => onProgress?.(fraction));
  if (cancelled) return 'cancelled';
  if (failed.length > 0) throw new Error(failed[0].error);
  await useBooksStore.getState().syncBooks();
  return 'added';
}
