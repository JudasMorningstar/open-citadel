import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { searchGutenbergOpds } from './gutenberg-opds.js';
import { GUTENBERG_SITE, authorsOf, gutendexBooks, stringsOf, type GutendexBook } from './gutendex.js';
import { readIdentity } from './identity.js';

/**
 * Free books, for the reader who arrives with an empty phone.
 *
 * Here rather than on the device for one reason: Project Gutenberg is somebody
 * else's website, and when it changes there should be one place to fix it
 * rather than an app update everyone has to install. The device only ever
 * downloads a URL this route hands it.
 *
 * Authenticated like every other route. It reads nothing of the user's and
 * spends nothing, but an open endpoint on this server is an open proxy, and
 * the only caller is a signed-in app mid-onboarding.
 */
export const gutenbergRoutes = new Hono();

export interface FreeBook {
  id: number;
  title: string;
  author: string;
  subjects: string[];
  /** Where the device downloads it from. */
  epubUrl: string;
  /** Gutenberg's own download count. A rough proxy for "is this the good one". */
  downloads: number;
}

/**
 * The EPUB URL for an ebook id.
 *
 * Deterministic, which is what keeps the fallback below simple: Gutenberg's
 * search only has to give back the id, never a download link. `.epub3.images` is the
 * format Gutenberg itself marks Recommended, and runs a few hundred kB for a
 * typical book.
 */
export function gutenbergEpubUrl(id: number): string {
  return `${GUTENBERG_SITE}/ebooks/${id}.epub3.images`;
}

function fromGutendex(book: GutendexBook): FreeBook | null {
  const id = Number(book.id);
  if (!Number.isInteger(id) || id <= 0) return null;

  const title = typeof book.title === 'string' ? book.title.trim() : '';
  if (!title) return null;

  /*
   * Only books that actually have an EPUB.
   *
   * The catalogue carries plain-text-only records, and offering one of those
   * would end with a download that succeeds and a file the reader cannot open.
   * The key has varied between Gutendex versions, so any epub-ish format
   * counts rather than one exact string.
   */
  const formats = book.formats ?? {};
  const hasEpub = Object.keys(formats).some((key) => key.includes('epub'));
  if (!hasEpub) return null;

  const author = authorsOf(book) ?? 'Unknown';
  const subjects = stringsOf(book.subjects).slice(0, 6);

  return {
    id,
    title,
    author,
    subjects,
    epubUrl: gutenbergEpubUrl(id),
    downloads: Number(book.download_count) || 0,
  };
}

/*
 * Turning what somebody said into something the catalogue can answer.
 *
 * Gutendex has two filters and neither of them is a search engine. `search`
 * splits on spaces and requires EVERY term to appear in the title or the
 * author name, so "biographies of great entrepreneurs and entrepreneurship"
 * asks for one book whose title contains the word "of" AND the word "and" AND
 * the word "biographies", and gets nothing. `topic` matches subjects and
 * bookshelves, but as a substring of a single string, so a sentence misses
 * there too.
 *
 * This is not hypothetical. It is what happened on the first real run: the
 * catalogue was fully loaded, the request reached the container, and 52 bytes
 * of honest, healthy zero came back.
 *
 * So the phrase is broken into keywords and asked as several small questions
 * rather than one impossible one.
 */
const STOPWORDS = new Set([
  'a', 'about', 'all', 'also', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been',
  'being', 'best', 'better', 'book', 'books', 'but', 'by', 'can', 'could', 'do', 'does',
  'for', 'from', 'get', 'great', 'greatest', 'has', 'have', 'how', 'i', 'if', 'im', 'in',
  'interest', 'interested', 'interesting', 'interests', 'into', 'is', 'it', 'its', 'just',
  'keen', 'know', 'like', 'looking', 'me', 'more', 'most', 'much', 'my', 'new', 'of', 'on',
  'or', 'our', 'out', 'read', 'reading', 'really', 'so', 'some', 'something', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'thing', 'things', 'this', 'to', 'up',
  'us', 'very', 'want', 'was', 'way', 'we', 'what', 'when', 'which', 'who', 'why', 'will',
  'with', 'would', 'you', 'your',
]);

/**
 * Crude suffix stripping, and crude is the point.
 *
 * `topic` is a substring match, so a shorter stem is a wider net rather than a
 * wrong one: "biography" finds both "Biography" and "Biographies", and
 * "entrepreneur" finds "Entrepreneurship". Over-matching is the goal here, so
 * a real stemmer would be a dependency that does the job less well.
 */
function stem(word: string): string {
  if (word.length > 6 && word.endsWith('ship')) return word.slice(0, -4);
  if (word.length > 6 && word.endsWith('ness')) return word.slice(0, -4);
  if (word.length > 5 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 5 && word.endsWith('ing')) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export function keywords(query: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of query.toLowerCase().replace(/[^a-z0-9\s'-]+/g, ' ').split(/\s+/)) {
    const word = raw.replace(/^['-]+|['-]+$/g, '');
    if (word.length < 3 || STOPWORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
  }
  return out;
}

/**
 * English, public domain in the USA, and an EPUB to actually open. Every probe
 * carries all three. A book still under copyright is shared by Gutenberg with
 * its holder's permission, which is not ours to pass on, so Samwell is never
 * shown one to offer (the app checks again before it downloads anything).
 */
const CATALOGUE_FILTERS = '&languages=en&copyright=false&mime_type=application%2Fepub%2Bzip';

async function gutendexQuery(params: string, limit: number): Promise<FreeBook[]> {
  const { results } = await gutendexBooks(`${params}${CATALOGUE_FILTERS}`);
  return results
    .map(fromGutendex)
    .filter((book): book is FreeBook => book !== null)
    .slice(0, limit);
}

/** How many of the keywords get asked about. Beyond this they are noise. */
const MAX_KEYWORD_PROBES = 4;

/**
 * The questions one phrase becomes, and how much each answer is worth.
 *
 * Exported so the fan-out can be tested without a catalogue: this function IS
 * the fix, and everything below it is merging.
 */
export function probesFor(query: string): { params: string; weight: number }[] {
  const terms = keywords(query);
  const probes: { params: string; weight: number }[] = [];

  /*
   * The literal reading first, and only when it could possibly match. Every
   * term has to land in one title, so past three words this is guaranteed to
   * return nothing and is a request spent proving it.
   */
  if (terms.length > 0 && terms.length <= 3) {
    probes.push({ params: `search=${encodeURIComponent(terms.join(' '))}`, weight: 3 });
  }

  for (const term of terms.slice(0, MAX_KEYWORD_PROBES)) {
    probes.push({ params: `topic=${encodeURIComponent(stem(term))}`, weight: 2 });
    // Titles as well as subjects. A lot of what somebody asks for is a word an
    // author put on a cover rather than one a librarian assigned afterwards.
    probes.push({ params: `search=${encodeURIComponent(term)}`, weight: 1 });
  }

  // Nothing survived the stopword list, which happens on "how do I get
  // better?". Ask it literally rather than asking nothing at all.
  if (probes.length === 0) {
    probes.push({ params: `search=${encodeURIComponent(query)}`, weight: 1 });
  }

  return probes;
}

async function searchGutendex(query: string, limit: number): Promise<FreeBook[]> {
  const probes = probesFor(query);

  const settled = await Promise.allSettled(
    probes.map((probe) => gutendexQuery(probe.params, limit)),
  );

  /*
   * One rejection is not a failure. These all go to the same container, so a
   * single failed probe means that one request, and answering with what the
   * others found beats throwing the lot away and scraping the site.
   */
  if (!settled.some((result) => result.status === 'fulfilled')) {
    const first = settled[0];
    const reason = first?.status === 'rejected' ? first.reason : null;
    throw reason instanceof Error ? reason : new Error('Gutendex could not be reached.');
  }

  /*
   * Merged by score rather than concatenated.
   *
   * A book that answers three of the keywords is a better answer than a
   * popular book that answers one, and the ranking has to say so. Straight
   * concatenation would hand Samwell the whole of the first keyword's shelf
   * before the second keyword got a word in.
   */
  const scored = new Map<number, { book: FreeBook; score: number }>();
  settled.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    const { weight } = probes[index];
    result.value.forEach((book, rank) => {
      // Position within its own probe still counts, so the catalogue's own
      // ordering by popularity is not thrown away entirely.
      const points = weight * (rank < 5 ? 2 : 1);
      const existing = scored.get(book.id);
      if (existing) existing.score += points;
      else scored.set(book.id, { book, score: points });
    });
  });

  return [...scored.values()]
    .sort((a, b) => b.score - a.score || b.book.downloads - a.book.downloads)
    .slice(0, limit)
    .map((entry) => entry.book);
}

/**
 * The fallback: Gutenberg's own search, through its OPDS feed rather than its
 * web pages, which its terms reserve for people (see `gutenberg-opds.ts`).
 *
 * It exists because the primary source is a self-hosted instance that can be
 * down, or empty for the hours after it is first deployed, for reasons that
 * have nothing to do with Project Gutenberg, and a reader's first two minutes
 * with the app is a bad time to discover a container did not come back up.
 *
 * No subjects and no download count from this path. Samwell picks from titles
 * and authors, which is worse and is still an answer.
 */
async function searchGutenbergSite(query: string, limit: number): Promise<FreeBook[]> {
  const books = await searchGutenbergOpds(query, limit);
  return books.map(({ id, title, author }) => ({
    id,
    title,
    author: author ?? 'Unknown',
    subjects: [],
    epubUrl: gutenbergEpubUrl(id),
    downloads: 0,
  }));
}

gutenbergRoutes.get('/gutenberg/search', async (c) => {
  await readIdentity(c);

  const query = (c.req.query('q') ?? '').trim();
  if (!query) {
    throw new HTTPException(400, { message: 'q is required.' });
  }

  /*
   * More than Samwell will offer, on purpose.
   *
   * He is told to pick the three that genuinely fit what the reader said, and
   * he cannot do that from a list of three. A wider shortlist is where the
   * choosing actually happens.
   */
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 12) || 12, 1), 25);

  try {
    const results = await searchGutendex(query, limit);
    if (results.length > 0) return c.json({ results, source: 'gutendex' as const });
    /*
     * Zero results falls through, and that is not the obvious call.
     *
     * The tidy view is that an empty answer from a healthy catalogue is an
     * answer, and asking a second source is a wasted request. That reasoning
     * assumes the catalogue is populated, and a self-hosted Gutendex is empty
     * for hours after it is first deployed while `updatecatalog` walks tens of
     * thousands of RDF files into Postgres. During that window every search
     * would answer "nothing found" in perfect health, and Samwell would tell a
     * brand new user that Project Gutenberg has nothing on what they care
     * about. That is the worst possible first impression, and it happens on
     * exactly the days somebody has just set this up.
     *
     * So an empty answer is treated as a miss rather than a verdict. The cost
     * is one extra request on genuinely obscure queries, and even there
     * Gutenberg's own search is fuzzier and may well do better.
     */
  } catch (error) {
    console.warn(
      `[Gutenberg] Catalogue search failed for "${query}", falling back to Gutenberg's own search:`,
      error,
    );
  }

  try {
    /*
     * Gutenberg's search gets the keywords too, not the sentence.
     *
     * Its own search is fuzzier than Gutendex's, which is why it is worth
     * asking at all, but it is still matching words against a catalogue rather
     * than reading a request. Handing it the full phrase is how a fallback
     * ends up confirming the answer it was called in to disagree with.
     */
    const terms = keywords(query).slice(0, 4);
    const results = await searchGutenbergSite(terms.join(' ') || query, limit);
    return c.json({ results, source: 'gutenberg-opds' as const });
  } catch (error) {
    console.error(`[Gutenberg] Both sources failed for "${query}":`, error);
    throw new HTTPException(502, {
      message: 'Could not reach Project Gutenberg.',
    });
  }
});
