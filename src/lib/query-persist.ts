import AsyncStorage from '@react-native-async-storage/async-storage';
import { dehydrate, type QueryClient } from '@tanstack/react-query';
import { persistQueryClientRestore, type PersistedClient, type Persister } from '@tanstack/react-query-persist-client';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

import { changesKept, DAY, isKeptCatalogue } from '@/lib/query-persist-policy';

/*
 * The part of the query cache kept across launches: the network catalogues
 * Explore's first screens are drawn from, so Explore opens on its shelves
 * rather than on a round trip to Apple or Samwell Cloud every time the app
 * starts. The library is already on the device (SQLite) and is read from
 * there; searches are one-off. `query-persist-policy` says which is which.
 *
 * Written when the app leaves the front, and only if a kept answer changed
 * since the last write. Never while the app is in use.
 *
 * It used to be TanStack's `PersistQueryClientProvider` with its storage
 * persister, which saves on every change to the cache. Opening Explore for
 * the first time brings twelve charts in over a few seconds, and each one
 * rewrote the whole copy (half a megabyte by the last, serialised on the JS
 * thread) while the page was being scrolled; Free Books did the same for
 * every shelf scrolled into view. Underneath that, every cache event in the
 * app, the library's reads included, walked the whole cache to rebuild the
 * copy just to find it unchanged. And every query, the library's too, waited
 * for the copy to be read back before its first read.
 *
 * So none of this sits in a provider now. A copy older than a day is thrown
 * away when the app starts, and so is any copy written by another version of
 * the app or in another shape.
 */

const STORAGE_KEY = 'open-citadel.query-cache';

/** Bump when what is kept changes shape, so a copy in the old shape is dropped rather than drawn. */
const COPY_SHAPE = 2;
const BUSTER = `${Constants.expoConfig?.version ?? ''}/${COPY_SHAPE}`;

/** Reads only: writing is `save`, on the app's own schedule. */
const persister: Persister = {
  persistClient: () => undefined,
  restoreClient: async () => {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    return text ? (JSON.parse(text) as PersistedClient) : undefined;
  },
  removeClient: () => AsyncStorage.removeItem(STORAGE_KEY),
};

/** A kept answer has changed since the copy was last written. */
let stale = false;

async function save(client: QueryClient): Promise<void> {
  stale = false;
  const copy: PersistedClient = {
    buster: BUSTER,
    timestamp: Date.now(),
    clientState: dehydrate(client, { shouldDehydrateQuery: (query) => isKeptCatalogue(query), shouldDehydrateMutation: () => false }),
  };
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
  } catch {
    // Storage full or busy: try again the next time the app leaves the front.
    stale = true;
  }
}

let started = false;

/**
 * Reads the kept catalogues back into the cache, and from then on writes
 * them out whenever the app leaves the front with something new to keep.
 *
 * Nothing waits on the read. A catalogue query that starts before it lands
 * (only by opening Explore within moments of launch) fetches as it would
 * have, and the copy then only fills in what is still missing or older.
 *
 * For the life of the app, like the cache itself: call it once.
 */
export function startQueryPersist(client: QueryClient): void {
  if (started) return;
  started = true;

  void persistQueryClientRestore({
    queryClient: client,
    persister,
    maxAge: DAY,
    buster: BUSTER,
    // A restored answer lives as long as the copy it came from. Left to the
    // cache's default it was collected ten minutes after launch unless Explore
    // had been opened, and the next save then wrote a copy without it. Each
    // kept query's own `gcTime` is at least this too, for the same reason.
    hydrateOptions: { defaultOptions: { queries: { gcTime: DAY } } },
  }).catch(() => {
    // An unreadable copy has already been removed; Explore fetches afresh.
  });

  client.getQueryCache().subscribe((event) => {
    if (!stale && changesKept(event)) stale = true;
  });

  // Leaving the front at all, not only reaching the background: on iOS an app
  // swiped away from the switcher goes from `inactive` straight to gone.
  AppState.addEventListener('change', (state) => {
    if (state !== 'active' && stale) void save(client);
  });
}
