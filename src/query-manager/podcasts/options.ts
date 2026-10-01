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
import { sameSet } from '@/utils/sets';

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
    // Sets do not share structure on their own, and a new object each read
    // redrew all of Explore (every tile asks "following?") on every library
    // change. The last answer is kept while the follows are the same.
    structuralSharing: (previous: unknown, next: unknown) => {
      const before = previous as FollowedKeys | undefined;
      const after = next as FollowedKeys;
      return before && sameSet(before.feedUrls, after.feedUrls) && sameSet(before.titles, after.titles) ? before : after;
    },
    ...options,
    queryKey: podcastKeys.followed(),
    queryFn: followedShowKeys,
  } satisfies UseQueryOptions<FollowedKeys>;
}

/**
 * A show already read by another query: the Podcasts page lists every
 * followed show whole, and an episode's page carries its show. Undefined when
 * neither has it.
 */
function cachedShow(id: string): { show: Podcast; at: number } | undefined {
  const home = queryClient.getQueryState<PodcastHomeData>(podcastKeys.home());
  const fromHome = home?.data?.shows.find((show) => show.id === id);
  if (fromHome) return { show: fromHome, at: home!.dataUpdatedAt };
  for (const [key, data] of queryClient.getQueriesData<EpisodePageData>({ queryKey: podcastKeys.library() })) {
    if (key[2] !== 'episode' || key.length !== 4) continue;
    const show = data?.detail?.show;
    if (show?.id === id) return { show, at: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0 };
  }
  return undefined;
}

/**
 * One show. Seeded from a cache that already holds it, so a show's page
 * opened from the Library or an episode draws its hero in its first frame:
 * the read itself is asynchronous and lands a few frames into the slide,
 * which swapped a skeleton for the hero mid-slide. Seeded data is as fresh as
 * the query it came from; every write invalidates both.
 */
export function createShowQueryOptions(id: string, options?: Options<Podcast | null>) {
  return {
    ...LIBRARY,
    initialData: () => cachedShow(id)?.show,
    initialDataUpdatedAt: () => cachedShow(id)?.at,
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

/** The episode rows a library query holds, read by the shape its key says it has. */
function episodesIn(key: readonly unknown[], data: unknown): EpisodeItem[] {
  if (data == null) return [];
  const [, , kind, , part] = key;
  if (kind === 'home' && key.length === 3) return Object.values((data as PodcastHomeData).shelves).flat();
  if (kind === 'section') return (data as PodcastSectionData).episodes;
  if (kind === 'show' && part === 'episodes') return data as EpisodeItem[];
  return [];
}

/**
 * An episode already read as a row of a list: the Podcasts page's shelves, a
 * "View all", a show's episodes. Whichever list it was tapped in holds it.
 */
function cachedEpisodeItem(id: string): { item: EpisodeItem; at: number } | undefined {
  for (const [key, data] of queryClient.getQueriesData({ queryKey: podcastKeys.library() })) {
    const item = episodesIn(key, data).find((episode) => episode.id === id);
    if (item) return { item, at: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0 };
  }
  return undefined;
}

/**
 * An episode as a list row draws it: no notes, with its show's name and
 * artwork. Seeded from the list it was tapped in, so an episode's page draws
 * its hero, cover and all, in its first frame instead of a few frames into
 * the slide, when the page's own read lands.
 */
export function createEpisodeItemQueryOptions(id: string, options?: Options<EpisodeItem | null>) {
  return {
    ...LIBRARY,
    initialData: () => cachedEpisodeItem(id)?.item,
    initialDataUpdatedAt: () => cachedEpisodeItem(id)?.at,
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
