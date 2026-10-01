import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { books, highlights } from '@/db/schema';
import { extractSurroundingText } from '@/services/book-context';

type Surrounding = { before?: string; after?: string };

function parseSurrounding(json: string | null): Surrounding | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Surrounding;
  } catch {
    return null;
  }
}

/**
 * What a chat about a highlight, started away from the reader, is grounded
 * in: the passage with the chapter text around it, so Samwell sees the
 * progression it was lifted from and not a bare quote.
 *
 * The surrounding text is captured when the highlight is made. One made
 * while that capture could not read its book (every file:// book, until the
 * reader's file fix) has none, so it is read now and kept for next time.
 * Falls back to the bare passage when the book cannot be read at all.
 */
export async function highlightChatContext(highlightId: string, text: string): Promise<string> {
  const row = db
    .select({ context: highlights.context, locator: highlights.locator, filePath: books.filePath })
    .from(highlights)
    .innerJoin(books, eq(highlights.bookId, books.id))
    .where(eq(highlights.id, highlightId))
    .get();
  let surrounding = parseSurrounding(row?.context ?? null);
  if (!surrounding && row?.filePath && row.locator) {
    try {
      const read = await extractSurroundingText(row.filePath, JSON.parse(row.locator));
      db.update(highlights).set({ context: JSON.stringify(read) }).where(eq(highlights.id, highlightId)).run();
      surrounding = read;
    } catch {
      // The bare passage is still a valid context.
    }
  }
  if (!surrounding) return text;
  const { before, after } = surrounding;
  return `${before ? `…${before}\n\n` : ''}[Highlighted:] ${text}${after ? `\n\n${after}…` : ''}`;
}
