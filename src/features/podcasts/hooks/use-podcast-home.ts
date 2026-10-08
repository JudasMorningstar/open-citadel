import { useQuery } from '@tanstack/react-query';

import { createPodcastHomeQueryOptions, type PodcastHomeData } from '@/query-manager/podcasts';

export type PodcastHome = PodcastHomeData & { loaded: boolean };

const EMPTY: PodcastHomeData = {
  shows: [],
  shelves: { continue: [], queue: [], inbox: [], latest: [], downloads: [], favorites: [], history: [] },
};

/** Everything the Podcasts page draws, read again whenever the library changes. */
export function usePodcastHome(): PodcastHome {
  const { data } = useQuery(createPodcastHomeQueryOptions());
  return { ...(data ?? EMPTY), loaded: data !== undefined };
}
