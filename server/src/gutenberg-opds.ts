/**
 * Project Gutenberg's own search, through its OPDS feed.
 *
 * The fallback for when Gutendex cannot answer. OPDS is the feed Gutenberg
 * offers "for use in applications" (gutenberg.org/ebooks/offline_catalogs.html);
 * its web pages are not. Its terms say the website "is intended for human
 * users only", and automated reads of it get the caller's IP blocked. This
 * server is one IP for every reader, so a block would take the fallback away
 * from everyone at once.
 *
 * Kept within what the terms ask of applications: one request, one page of
 * results, a user-agent with a contact address (`fetchWithTimeout`).
 *
 * A list entry is only an id, a title and an author, which is all the
 * onboarding search needs, since the EPUB address follows from the id.
 */
import { GUTENBERG_SITE, fetchWithTimeout } from './gutendex.js';

export type OpdsBook = { id: number; title: string; author: string | null };

const ENTRY = /<entry>([\s\S]*?)<\/entry>/g;
const ENTRY_ID = /<id>[^<]*\/ebooks\/(\d+)(?:\.opds)?<\/id>/;
const TITLE = /<title>([\s\S]*?)<\/title>/;
const AUTHOR = /<content type="text">([\s\S]*?)<\/content>/;

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The books in one page of an OPDS list. Entries that are not books (the
 * feed's own navigation links) have no eBook number and are left out.
 */
export function parseOpdsList(xml: string, limit: number): OpdsBook[] {
  const books: OpdsBook[] = [];
  for (const [, entry] of xml.matchAll(ENTRY)) {
    const id = Number(entry.match(ENTRY_ID)?.[1]);
    const title = decodeEntities(entry.match(TITLE)?.[1] ?? '');
    if (!Number.isInteger(id) || id <= 0 || !title) continue;
    books.push({ id, title, author: decodeEntities(entry.match(AUTHOR)?.[1] ?? '') || null });
    if (books.length >= limit) break;
  }
  return books;
}

export async function searchGutenbergOpds(query: string, limit: number): Promise<OpdsBook[]> {
  const response = await fetchWithTimeout(
    `${GUTENBERG_SITE}/ebooks/search.opds/?query=${encodeURIComponent(query)}`,
    'application/atom+xml',
  );
  if (!response.ok) throw new Error(`Project Gutenberg's catalogue returned HTTP ${response.status}`);
  return parseOpdsList(await response.text(), limit);
}
