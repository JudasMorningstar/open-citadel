import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';

/**
 * The app's one query cache.
 *
 * A module, not something made inside a component, because services write to
 * the library from outside React (the player's background task, a refresh
 * finishing) and have to be able to tell the cache so.
 *
 * Defaults are for network reads. The library's own queries (SQLite) override
 * them: they never go stale on a timer, only when a write says so. See
 * `query-manager/podcasts/options.ts`.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/*
 * "Window focus" is the app coming back to the front. A stale network query
 * (a chart, a search) refetches then; the library's queries never go stale on
 * their own, so they do not.
 */
focusManager.setEventListener((handleFocus) => {
  const subscription = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => subscription.remove();
});
