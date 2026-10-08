import { useQuery } from '@tanstack/react-query';

import {
  createChapterFileQueryOptions,
  createChaptersQueryOptions,
  createEpisodeItemQueryOptions,
  createEpisodeQueryOptions,
  type Chapter,
} from '@/query-manager/podcasts';

const NO_CHAPTERS: Chapter[] = [];

/**
 * One episode with its show, chapters and parsed notes, re-read whenever the
 * library changes. A chapter file published beside the episode is fetched
 * once, on first view, and its chapters join the list when it lands: not
 * before the page has landed, so its answer does not re-render the page
 * mid-slide.
 *
 * Until the page's own read lands, `listed` is the episode as the list it was
 * tapped in already holds it: everything but the notes, enough for the hero.
 * Never read for itself (`enabled: false`); it only has an answer when a list
 * had one.
 */
export function useEpisode(id: string, landed: boolean) {
  const episode = useQuery(createEpisodeQueryOptions(id));
  const listed = useQuery(createEpisodeItemQueryOptions(id, { enabled: false }));
  const chapters = useQuery(createChaptersQueryOptions(id));
  useQuery(createChapterFileQueryOptions(id, { enabled: landed }));

  return {
    detail: episode.data?.detail ?? null,
    listed: listed.data ?? null,
    notes: episode.data?.notes ?? [],
    chapters: chapters.data ?? NO_CHAPTERS,
    loaded: episode.data !== undefined,
  };
}
