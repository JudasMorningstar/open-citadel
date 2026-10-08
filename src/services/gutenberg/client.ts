/**
 * Asking for Project Gutenberg's catalogue.
 *
 * Through Samwell Cloud, which reads its own Gutendex: a copy of the catalogue
 * built daily from the bulk catalogue Gutenberg publishes for exactly this,
 * so browsing sends nothing to gutenberg.org. The routes are open (the books
 * are free to everyone, so no sign-in stands in the way) and every answer is
 * checked against the shape the server and the app share.
 *
 * Only a book's cover and its EPUB come from gutenberg.org itself, one at a
 * time as a reader sees or asks for them (`services/gutenberg/download`).
 */
import { CatalogBookDetailSchema, CatalogPageSchema, type CatalogBookDetail, type CatalogPage } from 'samwell-shared';

import { catalogListPath, type CatalogListQuery } from '@/services/gutenberg/records';
import { useSettingsStore } from '@/stores/settings';
import { createRequestGate } from '@/utils/request-gate';

const TIMEOUT_MS = 15_000;
/** A page of shelves asks together; the top ones are answered first. */
const turn = createRequestGate(3);

export class CatalogUnavailableError extends Error {}

async function getJson(path: string, signal?: AbortSignal): Promise<unknown> {
  const baseUrl = useSettingsStore.getState().cloudBaseUrl;
  if (!baseUrl) throw new CatalogUnavailableError('Free books are not set up on this device.');
  const done = await turn();
  // Cancelled while it waited its turn (a newer search, a closed screen): the
  // abort already fired, so the listener below would never hear it.
  if (signal?.aborted) {
    done();
    throw new CatalogUnavailableError('Cancelled.');
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort();
  signal?.addEventListener('abort', onAbort);
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/library/gutenberg/catalog${path}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new CatalogUnavailableError(`The free books catalogue answered ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
    done();
  }
}

/** One page of a shelf or a search. */
export async function fetchCatalogPage(query: CatalogListQuery, signal?: AbortSignal): Promise<CatalogPage> {
  return CatalogPageSchema.parse(await getJson(catalogListPath(query), signal));
}

/** One page of results, by title or author. */
export function searchCatalog(term: string, signal?: AbortSignal): Promise<CatalogPage> {
  const search = term.trim();
  if (!search) return Promise.resolve({ books: [], nextPage: null });
  return fetchCatalogPage({ search, page: 1 }, signal);
}

export async function fetchBookDetail(id: number, signal?: AbortSignal): Promise<CatalogBookDetail> {
  return CatalogBookDetailSchema.parse(await getJson(`/books/${id}`, signal));
}
