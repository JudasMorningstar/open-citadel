import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
  CatalogQuerySchema,
  type CatalogBook,
  type CatalogBookDetail,
  type CatalogPage,
  type CatalogQuery,
} from 'samwell-shared';

import { authorsOf, gutenbergFormat, gutendexBooks, stringsOf, type GutendexBook } from './gutendex.js';
import { rateLimit } from './rate-limit.js';

/**
 * The free books catalogue the app browses: Project Gutenberg's books, read
 * from the self-hosted Gutendex (`gutendex.ts`).
 *
 * Open, unlike the rest of this server. These books are free to everyone, and
 * Gutenberg's license is built on that, so browsing them must not wait on a
 * sign-in or a plan. That is safe because the routes only READ, and only
 * through the few bounded values in `CatalogQuerySchema`: host, path and every
 * other filter are fixed here, so there is no way to make this server fetch
 * something of the caller's choosing. A per-caller cap stops any one caller
 * leaning on it.
 */
export const gutenbergCatalogRoutes = new Hono();

/*
 * About a screen of Explore a second, sustained for a minute, per caller. A
 * reader scrolling every shelf and paging through a few is well inside it.
 */
gutenbergCatalogRoutes.use('/gutenberg/catalog/*', rateLimit({ limit: 240, windowMs: 60_000 }));

/**
 * What every list asks Gutendex, whatever the caller sent: English, public
 * domain in the USA, and an EPUB to download. A book still under copyright is
 * shared by Gutenberg with its holder's permission, and that permission is not
 * ours to pass on, so lists never show one.
 */
const FIXED_FILTERS = 'languages=en&copyright=false&mime_type=application%2Fepub%2Bzip';

/** A list query as Gutendex parameters. Exported for its test: it is the whole of what reaches Gutendex. */
export function gutendexListParams(query: CatalogQuery): string {
  const params = [FIXED_FILTERS, `page=${query.page}`];
  if (query.topic) params.push(`topic=${encodeURIComponent(query.topic)}`);
  if (query.search) params.push(`search=${encodeURIComponent(query.search)}`);
  // Gutendex orders by downloads unless told otherwise; `descending` is by
  // eBook number, which is the order Gutenberg added them in.
  if (query.sort === 'newest') params.push('sort=descending');
  return params.join('&');
}

function bookId(book: GutendexBook): number | null {
  const id = Number(book.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function toCatalogBook(book: GutendexBook): CatalogBook | null {
  const id = bookId(book);
  const title = typeof book.title === 'string' ? book.title.trim() : '';
  if (id == null || !title) return null;
  return { id, title, author: authorsOf(book), coverUrl: gutenbergFormat(book, 'image/') };
}

export function toCatalogDetail(book: GutendexBook): CatalogBookDetail | null {
  const base = toCatalogBook(book);
  if (!base) return null;
  const downloads = Number(book.download_count);
  return {
    ...base,
    summary: stringsOf(book.summaries)[0]?.trim() || null,
    language: stringsOf(book.languages)[0] ?? null,
    downloads: Number.isInteger(downloads) && downloads >= 0 ? downloads : null,
    subjects: stringsOf(book.subjects),
    // Gutendex's `copyright` is Gutenberg's own flag: false is public domain in the USA.
    publicDomain: typeof book.copyright === 'boolean' ? !book.copyright : null,
    epubUrl: gutenbergFormat(book, 'application/epub+zip'),
  };
}

gutenbergCatalogRoutes.get('/gutenberg/catalog/books', async (c) => {
  const parsed = CatalogQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new HTTPException(400, { message: 'That is not a catalogue query.' });
  const query = parsed.data;

  try {
    const { results, hasNext } = await gutendexBooks(gutendexListParams(query));
    const page: CatalogPage = {
      books: results.map(toCatalogBook).filter((book): book is CatalogBook => book !== null),
      nextPage: hasNext ? query.page + 1 : null,
    };
    // The catalogue changes daily; a reader's device keeps its own copy for
    // as long, and this lets anything in between do the same for an hour.
    c.header('Cache-Control', 'public, max-age=3600');
    return c.json(page);
  } catch (error) {
    console.error('[Gutenberg] Catalogue list failed:', error);
    throw new HTTPException(502, { message: 'Could not reach the free books catalogue.' });
  }
});

gutenbergCatalogRoutes.get('/gutenberg/catalog/books/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isInteger(id) || id <= 0) throw new HTTPException(400, { message: 'That is not a book number.' });

  let book: CatalogBookDetail | null;
  try {
    const { results } = await gutendexBooks(`ids=${id}`);
    const match = results.find((entry) => bookId(entry) === id);
    book = match ? toCatalogDetail(match) : null;
  } catch (error) {
    console.error(`[Gutenberg] Catalogue book ${id} failed:`, error);
    throw new HTTPException(502, { message: 'Could not reach the free books catalogue.' });
  }
  if (!book) throw new HTTPException(404, { message: 'Project Gutenberg has no book with that number.' });
  c.header('Cache-Control', 'public, max-age=3600');
  return c.json(book);
});
