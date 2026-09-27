import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';

import { useFreeBookDownload } from '@/features/free-books/hooks/use-free-book-download';
import type { FreeBookParams } from '@/features/free-books/hooks/use-open-catalog-book';
import { freeBookAction, freeBookActionHint, freeBookActionLabel, freeBookActionState } from '@/features/free-books/utils/book-action';
import { bookFacts } from '@/features/free-books/utils/book-facts';
import { useOpenReader } from '@/features/library/hooks/use-open-reader';
import { backTo } from '@/navigation/navigate';
import { createCatalogBookQueryOptions } from '@/query-manager/gutenberg';
import { canDownload, landingUrl } from '@/services/gutenberg/records';
import { useLibraryBookFromGutenberg } from '@/stores/books';

/**
 * A free book's page: what Project Gutenberg says about it, and the one thing
 * to do with it. Download, then Read once the Library has it; for a book still
 * under copyright, a link to its page on Gutenberg instead.
 */
export function useFreeBookScreen(params: FreeBookParams) {
  const router = useRouter();
  const id = Number(params.id);
  const query = useQuery(createCatalogBookQueryOptions(id));
  const book = query.data;
  const libraryBookId = useLibraryBookFromGutenberg(id);
  const openReader = useOpenReader();
  const { download, downloading, downloaded, progress } = useFreeBookDownload(book, libraryBookId !== null);

  const detail = book ? 'ready' : query.isError ? 'failed' : 'loading';
  const action = freeBookAction({
    detail,
    hasEpub: !!book?.epubUrl,
    downloadable: !!book && canDownload(book),
    inLibrary: libraryBookId !== null,
    downloading,
    downloaded,
  });

  const openOnGutenberg = React.useCallback(() => void WebBrowser.openBrowserAsync(landingUrl(id)).catch(() => {}), [id]);
  const onAction = React.useCallback(() => {
    if (action === 'read' && libraryBookId) openReader(libraryBookId);
    else if (action === 'download') download();
    else if (action === 'copyrighted' || action === 'unavailable') openOnGutenberg();
  }, [action, download, libraryBookId, openOnGutenberg, openReader]);

  const facts = React.useMemo(() => (book ? bookFacts(book) : []), [book]);

  return {
    hero: {
      title: book?.title ?? params.title ?? '',
      author: book?.author ?? params.author ?? null,
      coverUrl: book?.coverUrl ?? null,
      actionLabel: freeBookActionLabel(action),
      actionHint: freeBookActionHint(action, detail),
      ...freeBookActionState(action),
      progress,
      onAction,
    },
    about: {
      summary: book?.summary ?? null,
      facts,
      subjects: book?.subjects.length ? book.subjects.join(' · ') : null,
      onOpenGutenberg: openOnGutenberg,
    },
    loaded: detail !== 'loading',
    back: () => backTo(router, '/free-books/explore'),
  };
}
