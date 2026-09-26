import { useQuery } from '@tanstack/react-query';

import {
  createChapterFileQueryOptions,
  createChaptersQueryOptions,
  createEpisodeQueryOptions,
  type Chapter,
} from '@/query-manager/podcasts';

const NO_CHAPTERS: Chapter[] = [];

/**
 * One episode with its show, chapters and parsed notes, re-read whenever the
 * library changes. A chapter file published beside the episode is fetched
 * once, on first view, and its chapters join the list when it lands.
 */
export function useEpisode(id: string) {
  const episode = useQuery(createEpisodeQueryOptions(id));
  const chapters = useQuery(createChaptersQueryOptions(id));
  useQuery(createChapterFileQueryOptions(id));

  return {
    detail: episode.data?.detail ?? null,
    notes: episode.data?.notes ?? [],
    chapters: chapters.data ?? NO_CHAPTERS,
    loaded: episode.data !== undefined,
  };
}
