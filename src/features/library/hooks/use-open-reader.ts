import { useRouter } from 'expo-router';
import React from 'react';

import { useBooksStore } from '@/stores/books';

/**
 * Opens a book in the reader, or does nothing while it has no file yet (a
 * book still being copied in by a scan). Stable: it reads the books at press
 * time rather than closing over them, so memoized rows keep their props.
 */
export function useOpenReader() {
  const router = useRouter();
  return React.useCallback(
    (bookId: string) => {
      const book = useBooksStore.getState().books.find((b) => b.id === bookId);
      if (!book?.filePath) return;
      router.push(`/reader/${bookId}` as any);
    },
    [router],
  );
}
