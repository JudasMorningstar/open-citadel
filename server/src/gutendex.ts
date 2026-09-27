/**
 * Reading Project Gutenberg's catalogue through Gutendex.
 *
 * Gutendex is the JSON API over that catalogue, self-hosted beside this server
 * (`deploy/gutendex.compose.yml`). It builds its database from the bulk
 * catalogue Gutenberg publishes for exactly this use
 * (`gutenberg.org/cache/epub/feeds/rdf-files.tar.bz2`, "granted to the public
 * domain" in Gutenberg's robot policy) and refreshes it daily, so reading it
 * sends nothing to gutenberg.org at all.
 *
 * Shared by Samwell's onboarding search (`gutenberg.ts`) and the app's free
 * books catalogue (`gutenberg-catalog.ts`).
 */

/*
 * Where the catalogue is read from. Environment rather than code because the
 * URL names self-hosted infrastructure and this repository is public, the
 * same rule `SAMWELL_CLOUD_URL` and the Logto endpoint already follow. The
 * public instance is the fallback default, so a machine with no configuration
 * still works.
 *
 * `||`, not `??`, and the difference is not academic. Creating the key in a
 * deployment UI and leaving the box empty is the normal way this variable
 * comes into existence, and an empty string is neither null nor undefined —
 * so `??` would keep it, the base URL would be `''`, and every request would
 * build a relative URL that `fetch` cannot parse.
 */
export const GUTENDEX_URL = (process.env.GUTENDEX_URL?.trim() || 'https://gutendex.com').replace(/\/+$/, '');

export const GUTENBERG_SITE = 'https://www.gutenberg.org';

/**
 * Who is asking, when a request goes to gutenberg.org. Gutenberg's terms ask
 * applications for "a proper user-agent" with "a contact address".
 */
export const GUTENBERG_USER_AGENT = 'OpenCitadel/1.0 (+https://www.open-citadel.online)';

/** How long a source gets before a route gives up on it. */
const SOURCE_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(url: string, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: accept, 'User-Agent': GUTENBERG_USER_AGENT },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** A book as Gutendex returns it. Every field checked before use: it is JSON from another process. */
export type GutendexBook = {
  id?: unknown;
  title?: unknown;
  authors?: { name?: unknown }[];
  summaries?: unknown;
  subjects?: unknown;
  bookshelves?: unknown;
  languages?: unknown;
  copyright?: unknown;
  download_count?: unknown;
  formats?: Record<string, unknown>;
};

/**
 * One page of `/books/`. `params` are already encoded.
 *
 * Trailing slash on purpose. DRF's DefaultRouter registers the viewset at
 * `/books/`, and Django's APPEND_SLASH would answer `/books?...` with a 301 to
 * exactly this URL. Following a redirect on every request is a round trip
 * spent to save a character.
 */
export async function gutendexBooks(params: string): Promise<{ results: GutendexBook[]; hasNext: boolean }> {
  const response = await fetchWithTimeout(`${GUTENDEX_URL}/books/?${params}`, 'application/json');
  if (!response.ok) throw new Error(`Gutendex returned HTTP ${response.status}`);
  const body = (await response.json()) as { results?: unknown; next?: unknown };
  return {
    results: Array.isArray(body.results) ? (body.results as GutendexBook[]) : [],
    hasNext: typeof body.next === 'string' && body.next.length > 0,
  };
}

/** "Dyer, Frank Lewis" is how the catalogue stores it, not how anyone says it. */
export function humanizeAuthor(name: string): string {
  const [surname, rest] = name.split(/,\s*/, 2);
  if (!rest) return name.trim();
  // Life dates ride along on some records: "Twain, Mark, 1835-1910".
  const given = rest.replace(/,?\s*\d{3,4}\??\s*-\s*\d{0,4}\??\s*$/, '').trim();
  return given ? `${given} ${surname}`.trim() : surname.trim();
}

/** Every author, said the way people say names, or null when the record has none. */
export function authorsOf(book: GutendexBook): string | null {
  const authors = Array.isArray(book.authors) ? book.authors : [];
  const names = authors
    .map((entry) => (typeof entry?.name === 'string' ? humanizeAuthor(entry.name) : ''))
    .filter(Boolean);
  return names.length > 0 ? names.join(' and ') : null;
}

export function stringsOf(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((s): s is string => typeof s === 'string') : [];
}

/**
 * A format's address, only if it is on Gutenberg's own site. The device
 * downloads what this hands it, so nothing from anywhere else gets through.
 */
export function gutenbergFormat(book: GutendexBook, mimePrefix: string): string | null {
  for (const [mime, url] of Object.entries(book.formats ?? {})) {
    if (mime.startsWith(mimePrefix) && typeof url === 'string' && url.startsWith(`${GUTENBERG_SITE}/`)) return url;
  }
  return null;
}
