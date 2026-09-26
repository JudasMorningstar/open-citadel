import type { ShowEpisodeFilter } from '@/services/podcasts/episodes';
import type { PodcastSection } from '@/features/podcasts/utils/sections';

/**
 * Every podcast query's key.
 *
 * Everything read from the library (SQLite) sits under `library()`, so one
 * invalidation after a write refreshes whatever is on screen and marks the
 * rest to be read again when next shown. Work that must not re-run on a
 * library change (fetching a new show's feed, a chapter file) sits outside it.
 */
export const podcastKeys = {
  all: ['podcasts'] as const,

  library: () => [...podcastKeys.all, 'library'] as const,
  home: () => [...podcastKeys.library(), 'home'] as const,
  section: (section: PodcastSection) => [...podcastKeys.library(), 'section', section] as const,
  followed: () => [...podcastKeys.library(), 'followed'] as const,
  show: (id: string) => [...podcastKeys.library(), 'show', id] as const,
  showEpisodes: (id: string, sort: 'newest' | 'oldest', filter: ShowEpisodeFilter) =>
    [...podcastKeys.show(id), 'episodes', { sort, filter }] as const,
  episode: (id: string) => [...podcastKeys.library(), 'episode', id] as const,
  episodeItem: (id: string) => [...podcastKeys.episode(id), 'item'] as const,
  chapters: (id: string) => [...podcastKeys.episode(id), 'chapters'] as const,

  /** A show found in Explore, fetched and stored: resolves to its id. */
  discovered: (appleId: string | null, feedUrl: string | null) =>
    [...podcastKeys.all, 'discovered', { appleId, feedUrl }] as const,
  /** An episode's published chapter file, fetched once per session. */
  chapterFile: (id: string) => [...podcastKeys.all, 'chapter-file', id] as const,
};
