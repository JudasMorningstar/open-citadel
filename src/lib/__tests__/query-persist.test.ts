import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** The device, as far as the kept copy is concerned: one storage slot and the app coming and going. */
const device = vi.hoisted(() => ({
  stored: null as string | null,
  writes: [] as string[],
  appStateListeners: [] as ((state: string) => void)[],
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async () => device.stored,
    setItem: async (_key: string, value: string) => {
      device.stored = value;
      device.writes.push(value);
    },
    removeItem: async () => {
      device.stored = null;
    },
  },
}));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '9.9.9' } } }));
vi.mock('react-native', () => ({
  AppState: {
    addEventListener: (_event: string, listener: (state: string) => void) => {
      device.appStateListeners.push(listener);
      return { remove: () => undefined };
    },
  },
}));

const CHART = ['discovery', 'chart', 'all', 50] as const;
const SHOWS = [{ appleId: '1', title: 'A show', author: null, artworkUrl: null, feedUrl: null }];

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const leaveTheFront = async () => {
  for (const listener of device.appStateListeners) listener('background');
  await settle();
};

async function start() {
  vi.resetModules();
  device.appStateListeners.length = 0;
  const { startQueryPersist } = await import('@/lib/query-persist');
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
  startQueryPersist(client);
  await settle();
  return client;
}

describe('the kept copy of the query cache', () => {
  beforeEach(() => {
    device.stored = null;
    device.writes.length = 0;
  });

  it('is not written while the app is in use, however much arrives', async () => {
    const client = await start();
    for (let genre = 0; genre < 12; genre++) client.setQueryData(['discovery', 'chart', genre, 50], SHOWS);
    await settle();
    expect(device.writes).toHaveLength(0);
  });

  it('is written once when the app leaves the front, with the catalogues and nothing else', async () => {
    const client = await start();
    client.setQueryData(CHART, SHOWS);
    client.setQueryData(['gutenberg', 'shelf-preview', 'popular'], { books: [] });
    client.setQueryData(['gutenberg', 'book', 7213], { id: 7213 });
    client.setQueryData(['discovery', 'search', 'history'], SHOWS);
    client.setQueryData(['podcasts', 'library', 'shows'], [{ id: 'show' }]);
    await leaveTheFront();
    await leaveTheFront();

    expect(device.writes).toHaveLength(1);
    const hashes = JSON.parse(device.writes[0]).clientState.queries.map((query: { queryHash: string }) => query.queryHash);
    expect(hashes.sort()).toEqual(['["discovery","chart","all",50]', '["gutenberg","shelf-preview","popular"]']);
  });

  it('is left alone when only the library changed', async () => {
    const client = await start();
    client.setQueryData(CHART, SHOWS);
    await leaveTheFront();
    client.setQueryData(['podcasts', 'library', 'shows'], [{ id: 'show' }]);
    client.setQueryData(['podcasts', 'library', 'shows'], [{ id: 'another' }]);
    await leaveTheFront();
    expect(device.writes).toHaveLength(1);
  });

  it('is read back on the next launch without being written again', async () => {
    const first = await start();
    first.setQueryData(CHART, SHOWS);
    await leaveTheFront();

    const next = await start();
    expect(next.getQueryData(CHART)).toEqual(SHOWS);
    await leaveTheFront();
    expect(device.writes).toHaveLength(1);
  });

  it('does not hold anything back while it is read', async () => {
    const first = await start();
    first.setQueryData(CHART, SHOWS);
    await leaveTheFront();

    vi.resetModules();
    const { startQueryPersist } = await import('@/lib/query-persist');
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false } } });
    startQueryPersist(client);
    // Straight away, before the copy has been read: the library's reads run.
    const shows = await client.fetchQuery({ queryKey: ['podcasts', 'library', 'shows'], queryFn: async () => ['mine'] });
    expect(shows).toEqual(['mine']);
  });

  it('is thrown away when another version of the app wrote it', async () => {
    device.stored = JSON.stringify({
      buster: '1.0.0',
      timestamp: Date.now(),
      clientState: { mutations: [], queries: [{ queryKey: CHART, queryHash: JSON.stringify(CHART), state: { data: SHOWS, dataUpdatedAt: Date.now(), status: 'success' } }] },
    });
    const client = await start();
    expect(client.getQueryData(CHART)).toBeUndefined();
    expect(device.stored).toBeNull();
  });
});
