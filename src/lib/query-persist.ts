import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import type { Query } from '@tanstack/react-query';
import type { PersistedClient, Persister, PersistQueryClientOptions } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';

/*
 * The part of the query cache kept across launches: the network catalogues,
 * so Explore opens on its shelves rather than on a round trip to Apple or
 * Samwell Cloud every time the app starts.
 *
 * Only those. The library is already on the device (SQLite) and is read from
 * there; searches are one-off. What is kept is a copy of what is in memory,
 * rewritten (at most once a second) whenever it changes, so it never grows
 * past the cache itself. A copy older than a day is thrown away when the app
 * starts, and so is any copy written by another version of the app.
 */

const DAY = 24 * 60 * 60_000;

/** The query-manager roots that are network catalogues: see `discovery/keys.ts`, `gutenberg/keys.ts`. */
const CATALOGUES = new Set(['discovery', 'gutenberg']);

/**
 * A catalogue answer worth keeping. Kept on having one, not on the last read
 * having worked: a refetch that fails (offline, Apple saying "slow down")
 * leaves the answer it had in place, and dropping it then would open Explore
 * on a skeleton next launch over a passing hiccup.
 */
function isKeptCatalogue(query: Query): boolean {
  const [root, kind] = query.queryKey;
  return query.state.data !== undefined && CATALOGUES.has(String(root)) && kind !== 'search';
}

/** Which answers a copy holds: each kept query, as of its last answer. */
function contentsOf(client: PersistedClient): string {
  return client.clientState.queries.map((query) => `${query.queryHash}@${query.state.dataUpdatedAt}`).join('|');
}

const storage = createAsyncStoragePersister({ storage: AsyncStorage, key: 'open-citadel.query-cache', throttleTime: 1000 });

/*
 * Every change anywhere in the cache asks for a save, the library's reads
 * included, and the copy is half a megabyte of charts: written whole each
 * time, on the JS thread, over a podcast refresh that re-reads the library a
 * dozen times. Nearly all of those change nothing kept, so a copy that would
 * hold the same answers as the last one written (or the one restored) is not
 * written. Its date then stays that of its answers, which is the age `maxAge`
 * should be judging anyway.
 */
let written = '';
const persister: Persister = {
  persistClient: (client) => {
    const contents = contentsOf(client);
    if (contents === written) return undefined;
    written = contents;
    return storage.persistClient(client);
  },
  restoreClient: async () => {
    const client = await storage.restoreClient();
    if (client) written = contentsOf(client);
    return client;
  },
  removeClient: () => {
    written = '';
    return storage.removeClient();
  },
};

export const queryPersistOptions: Omit<PersistQueryClientOptions, 'queryClient'> = {
  persister,
  maxAge: DAY,
  buster: Constants.expoConfig?.version ?? '',
  dehydrateOptions: { shouldDehydrateQuery: isKeptCatalogue },
  // A restored answer lives as long as the copy it came from. Left to the
  // cache's default it was collected ten minutes after launch unless Explore
  // had been opened, and the next save then wrote a copy without it. Each kept
  // query's own `gcTime` is at least this too, for the same reason.
  hydrateOptions: { defaultOptions: { queries: { gcTime: DAY } } },
};
