/*
 * Which part of the query cache is kept across launches, and which cache
 * events change it. Pure, so it can be tested without a device: the reading
 * and writing are in `query-persist.ts`.
 */

export const DAY = 24 * 60 * 60_000;

/**
 * The kept kinds, by query-manager root: what Explore's first screens are
 * drawn from, and nothing else (see `discovery/keys.ts`, `gutenberg/keys.ts`).
 *
 * A shelf's "View all" pages and a book's own page are left out on purpose.
 * A shelf's first page was being written twice, once as the preview and once
 * as the first page of its paged entry, and every book opened added its entry
 * for good. Both come back with one request when they are asked for.
 */
const KEPT_KINDS: Record<string, string> = { discovery: 'chart', gutenberg: 'shelf-preview' };

/** Whether a query key names a kept catalogue. */
export function isKeptKey(queryKey: readonly unknown[]): boolean {
  const [root, kind] = queryKey;
  return typeof root === 'string' && KEPT_KINDS[root] !== undefined && KEPT_KINDS[root] === kind;
}

type KeptCandidate = { queryKey: readonly unknown[]; state: { data: unknown; dataUpdatedAt: number } };

/**
 * A catalogue answer worth writing. Kept on having one, not on the last read
 * having worked: a refetch that fails (offline, Apple saying "slow down")
 * leaves the answer it had in place, and dropping it then would open Explore
 * on a skeleton next launch over a passing hiccup. An answer more than a day
 * old is not written: it would only be thrown away when read back.
 */
export function isKeptCatalogue(query: KeptCandidate, now: number = Date.now()): boolean {
  return query.state.data !== undefined && isKeptKey(query.queryKey) && now - query.state.dataUpdatedAt < DAY;
}

type CacheEvent = { type: string; query: { queryKey: readonly unknown[] }; action?: { type: string } };

/**
 * Whether a cache event leaves the kept copy out of date: a kept catalogue
 * took a new answer, or was dropped.
 *
 * Asked of every event in the cache (the library's reads included, a dozen at
 * a time through a podcast refresh), so it looks at the one query the event
 * is about and nothing else.
 */
export function changesKept(event: CacheEvent): boolean {
  if (event.type === 'removed') return isKeptKey(event.query.queryKey);
  return event.type === 'updated' && event.action?.type === 'success' && isKeptKey(event.query.queryKey);
}
