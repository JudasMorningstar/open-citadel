import { z } from 'zod';

/**
 * Free books: Project Gutenberg's catalogue as Samwell Cloud serves it from
 * its own Gutendex, which it refreshes daily from Gutenberg's bulk catalogue.
 *
 * One shape for the server that builds it and the app that reads it.
 */

/** How a list is ordered: most downloaded first, or newest to Gutenberg first. */
export const CatalogSortSchema = z.enum(['popular', 'newest']);
export type CatalogSort = z.infer<typeof CatalogSortSchema>;

/**
 * Everything a list may be asked for, and nothing else.
 *
 * The catalogue routes need no sign-in, so they must not be a way to make the
 * server fetch anything it chooses: these few values, bounded, are all that
 * reaches Gutendex, and the server fixes the rest.
 */
export const CatalogQuerySchema = z.object({
  /** A bookshelf or subject, matched as part of its name: `Category: Poetry`. */
  topic: z.string().trim().min(1).max(80).optional(),
  /** Words to find in titles and authors' names. */
  search: z.string().trim().min(1).max(120).optional(),
  sort: CatalogSortSchema.default('popular'),
  page: z.coerce.number().int().min(1).max(500).default(1),
});
export type CatalogQuery = z.infer<typeof CatalogQuerySchema>;

/** A book as a list shows it. */
export const CatalogBookSchema = z.object({
  /** Gutenberg's eBook number. */
  id: z.number().int().positive(),
  title: z.string(),
  author: z.string().nullable(),
  coverUrl: z.string().nullable(),
});
export type CatalogBook = z.infer<typeof CatalogBookSchema>;

export const CatalogPageSchema = z.object({
  books: z.array(CatalogBookSchema),
  /** The page to ask for next, or null on the last. */
  nextPage: z.number().int().positive().nullable(),
});
export type CatalogPage = z.infer<typeof CatalogPageSchema>;

/** A book as its own page shows it. */
export const CatalogBookDetailSchema = CatalogBookSchema.extend({
  /** Gutenberg's own summary, which it marks as automatically written. */
  summary: z.string().nullable(),
  /** ISO code, `en`. */
  language: z.string().nullable(),
  /** Downloads from Gutenberg over the last 30 days. */
  downloads: z.number().int().nonnegative().nullable(),
  subjects: z.array(z.string()),
  /**
   * `true` when the catalogue marks it public domain in the USA, `false`
   * when it is still under copyright, `null` when the catalogue does not say.
   */
  publicDomain: z.boolean().nullable(),
  /** Gutenberg's EPUB, always on gutenberg.org; null when there is none. */
  epubUrl: z.string().nullable(),
});
export type CatalogBookDetail = z.infer<typeof CatalogBookDetailSchema>;
