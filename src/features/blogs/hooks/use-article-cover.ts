import { eq } from 'drizzle-orm';
import React from 'react';

import { db } from '@/db/client';
import { books } from '@/db/schema';

export function useArticleCover(bookId: string | null): string | null {
  return React.useMemo(() => {
    if (!bookId) return null;
    return db.select({ coverUrl: books.coverUrl }).from(books).where(eq(books.id, bookId)).get()?.coverUrl ?? null;
  }, [bookId]);
}