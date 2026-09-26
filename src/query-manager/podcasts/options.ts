import type { UseQueryOptions } from '@tanstack/react-query';

import type { PodcastSection } from '@/features/podcasts/utils/sections';
import { queryClient } from '@/lib/query-client';
import { podcastKeys } from '@/query-manager/podcasts/keys';
import { openDiscoveredShow } from '@/services/podcasts/actions';
import { ensureChapters } from '@/services/podcasts/chapters';
import { downloadedBytes } from '@/services/podcasts/downloads';
import {
  getEpisode,
  getEpisodeItem,
  listChapters,
  listShelf,
  listShowEpisodes,
  type EpisodeDetail,
  type EpisodeShelf,
  type ShowEpisodeFilter,
} from '@/services/podcasts/episodes';
import type { EpisodeItem, Podcast, ShowItem } from '@/services/podcasts/records';
import { parseShowNotes, type NoteBlock } from '@/services/podcasts/show-notes';
import { followedShowKeys, getShow, listSubscribedShows } from '@/services/podcasts/shows';

type Options<T, TData = T> = Omit<UseQueryOptions<T, Error, TData>, 'queryKey' | 'queryFn'>;

/**
 * The library lives on the device and only changes when the app writes to it,
 * and every write invalidates `podcastKeys.library()`. So its reads never go
 * stale on a timer, and never wait for a network.
 */
const LIBRARY = { staleTime: Infinity, gcTime: 5 * 60_000, networkMode: 'always', retry: false } as const;

/** How many of each list a home shelf draws; "View all" has the rest. */
export const HOME_SHELF_LIMIT = 15;
const HOME_SHELVES: EpisodeShelf[] = ['continue', 'queue', 'inbox', 'latest', 'downloads', 'favorites', 'history'];

export type PodcastHomeData = {
  shows: ShowItem[];
  shelves: Record<EpisodeShelf, EpisodeItem[]>;
};

/** Everything the Podcasts page draws. The reads overlap: none needs another's answer. */
export function createPodcastHomeQueryOptions<TData = PodcastHomeData>(options?: Options<PodcastHomeData, TData>) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.home(),
    queryFn: async (): Promise<PodcastHomeData> => {
      const [shows, ...lists] = await Promise.all([
        listSubscribedShows(),
        ...HOME_SHELVES.map((shelf) => listShelf(shelf, HOME_SHELF_LIMIT)),
      ]);
      const shelves = Object.fromEntries(HOME_SHELVES.map((key, i) => [key, lists[i]])) as PodcastHomeData['shelves'];
      return { shows: shows as ShowItem[], shelves };
    },
  } satisfies UseQueryOptions<PodcastHomeData, Error, TData>;
}

/**
 * Lists that grow without end (every episode of every show, every episode ever
 * played, which an import can make tens of thousands long) are cut to their
 * most recent few hundred. Nobody scrolls further, and the rows are held in
 * memory.
 */
const UNBOUNDED = new Set<PodcastSection>(['latest', 'history']);
const LONG_LIST_LIMIT = 500;

export type PodcastSectionData = { episodes: EpisodeItem[]; shows: ShowItem[]; bytes: number };

/** A whole shelf, for its "View all", with the downloads' size on disk when that is the shelf. */
export function createPodcastSectionQueryOptions<TData = PodcastSectionData>(
  section: PodcastSection,
  options?: Options<PodcastSectionData, TData>,
) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.section(section),
    queryFn: async (): Promise<PodcastSectionData> => {
      if (section === 'shows') return { episodes: [], shows: await listSubscribedShows(), bytes: 0 };
      const [episodes, bytes] = await Promise.all([
        listShelf(section, UNBOUNDED.has(section) ? LONG_LIST_LIMIT : undefined),
        section === 'downloads' ? downloadedBytes() : Promise.resolve(0),
      ]);
      return { episodes, shows: [], bytes };
    },
  } satisfies UseQueryOptions<PodcastSectionData, Error, TData>;
}

type FollowedKeys = Awaited<ReturnType<typeof followedShowKeys>>;

/** Feed addresses and titles of every show followed, so Explore can say "Following". */
export function createFollowedShowsQueryOptions(options?: Options<FollowedKeys>) {
  return {
    ...LIBRARY,
    // Sets do not share structure; a new answer is a new object either way.
    structuralSharing: false,
    ...options,
    queryKey: podcastKeys.followed(),
    queryFn: followedShowKeys,
  } satisfies UseQueryOptions<FollowedKeys>;
}

export function createShowQueryOptions(id: string, options?: Options<Podcast | null>) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.show(id),
    queryFn: () => getShow(id),
  } satisfies UseQueryOptions<Podcast | null>;
}

export function createShowEpisodesQueryOptions(
  id: string,
  sort: 'newest' | 'oldest',
  filter: ShowEpisodeFilter,
  options?: Options<EpisodeItem[]>,
) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.showEpisodes(id, sort, filter),
    queryFn: () => listShowEpisodes(id, sort, filter),
  } satisfies UseQueryOptions<EpisodeItem[]>;
}

export type EpisodePageData = { detail: EpisodeDetail | null; notes: NoteBlock[] };

/**
 * One episode with its show, and its notes parsed once per read rather than
 * per render: they can be long, and the page re-renders on every play state
 * change. Structural sharing keeps the parsed blocks' identity when the notes
 * did not change.
 */
export function createEpisodeQueryOptions(id: string, options?: Options<EpisodePageData>) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.episode(id),
    queryFn: async (): Promise<EpisodePageData> => {
      const detail = await getEpisode(id);
      return { detail, notes: parseShowNotes(detail?.episode.description) };
    },
  } satisfies UseQueryOptions<EpisodePageData>;
}

/** An episode as a list row draws it: no notes, with its show's name and artwork. */
export function createEpisodeItemQueryOptions(id: string, options?: Options<EpisodeItem | null>) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.episodeItem(id),
    queryFn: () => getEpisodeItem(id),
  } satisfies UseQueryOptions<EpisodeItem | null>;
}

export type Chapter = Awaited<ReturnType<typeof listChapters>>[number];

export function createChaptersQueryOptions(id: string, options?: Options<Chapter[]>) {
  return {
    ...LIBRARY,
    ...options,
    queryKey: podcastKeys.chapters(id),
    queryFn: () => listChapters(id),
  } satisfies UseQueryOptions<Chapter[]>;
}

/**
 * The chapter file an episode publishes beside itself (Podcasting 2.0),
 * fetched once per session and stored; the stored chapters are then read
 * through `createChaptersQueryOptions` like any others.
 */
export function createChapterFileQueryOptions(id: string, options?: Options<boolean>) {
  return {
    staleTime: Infinity,
    gcTime: 30 * 60_000,
    retry: false,
    ...options,
    queryKey: podcastKeys.chapterFile(id),
    queryFn: async () => {
      const added = await ensureChapters(id);
      if (added) void queryClient.invalidateQueries({ queryKey: podcastKeys.chapters(id) });
      return added;
    },
  } satisfies UseQueryOptions<boolean>;
}

export type DiscoveredShowRef = { appleId: string | null; feedUrl: string | null };

/**
 * A show found in Explore, fetched and stored as a preview: resolves to its
 * id. Outside the library key on purpose: it writes, and must not run again
 * because the library changed.
 *
 * Checked again every time a show page opens (`staleTime: 0`), with the last
 * answer drawn meanwhile. The show behind a cached id can be gone (unfollowed,
 * or a preview tidied away), and re-checking is cheap: a show already stored
 * returns from the database without fetching its feed. The alternative,
 * dropping the cache when a show is deleted, made a page that was still open
 * (the one the listener unfollowed from) fetch and store the show all over
 * again in the middle of its back slide.
 */
export function createDiscoveredShowQueryOptions(show: DiscoveredShowRef, options?: Options<string>) {
  return {
    staleTime: 0,
    gcTime: 60 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    ...options,
    queryKey: podcastKeys.discovered(show.appleId, show.feedUrl),
    queryFn: () => openDiscoveredShow(show),
  } satisfies UseQueryOptions<string>;
}
