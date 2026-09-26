import { useQuery } from '@tanstack/react-query';

import type { PodcastSection } from '@/features/podcasts/utils/sections';
import { createPodcastSectionQueryOptions, type PodcastSectionData } from '@/query-manager/podcasts';

const EMPTY: PodcastSectionData = { episodes: [], shows: [], bytes: 0 };

/** A whole shelf, for its "View all", with the downloads' size on disk when that is the shelf. */
export function usePodcastSection(section: PodcastSection) {
  const { data } = useQuery(createPodcastSectionQueryOptions(section));
  return { ...(data ?? EMPTY), loaded: data !== undefined };
}
