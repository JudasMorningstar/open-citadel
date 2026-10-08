import { Image } from 'expo-image';
import type { ImperativeRouter } from 'expo-router';

import { queryClient } from '@/lib/query-client';
import { createChartQueryOptions } from '@/query-manager/discovery';
import {
  createChaptersQueryOptions,
  createEpisodeItemQueryOptions,
  createEpisodeQueryOptions,
  createFollowedShowsQueryOptions,
  createShowEpisodesQueryOptions,
  createShowQueryOptions,
} from '@/query-manager/podcasts';
import { EXPLORE_GENRES } from '@/services/podcasts/discovery';

/*
 * Opening a podcasts page from anywhere. Each read starts as the press lands,
 * so the page is drawn from its first frame, or its wait has already begun,
 * instead of a skeleton filling in during the slide. Only reads: anything that
 * writes, or parses a feed, still waits for the page to land.
 */

/**
 * An episode's own picture, downloaded from the tap rather than from the
 * page's first frame. Lists that leave the picture out (a show's episodes)
 * never loaded it, so the page would otherwise wait the whole download on
 * its show's cover. To disk only: these can be thousands of pixels across.
 */
function prefetchEpisodePicture(episodeId: string): void {
  queryClient
    .fetchQuery(createEpisodeItemQueryOptions(episodeId))
    .then((item) => (item?.imageUrl ? Image.prefetch(item.imageUrl, 'disk') : false))
    .catch(() => {});
}

export function openEpisodePage(router: ImperativeRouter, episodeId: string): void {
  prefetchEpisodePicture(episodeId);
  void queryClient.prefetchQuery(createEpisodeQueryOptions(episodeId));
  void queryClient.prefetchQuery(createChaptersQueryOptions(episodeId));
  router.push({ pathname: '/podcasts/episode/[id]', params: { id: episodeId } });
}

/** A show and its episodes, listed the way the page first lists them: its own order, everything. */
export function openShowPage(router: ImperativeRouter, showId: string): void {
  queryClient
    .fetchQuery(createShowQueryOptions(showId))
    .then((show) =>
      show ? queryClient.prefetchQuery(createShowEpisodesQueryOptions(showId, show.episodeSort ?? 'newest', 'all')) : null,
    )
    .catch(() => {});
  router.push({ pathname: '/podcasts/show/[id]', params: { id: showId } });
}

/**
 * Explore: every chart, from Apple's directory, and which shows are followed.
 * The charts are what its page waits on, a round trip each.
 */
export function openPodcastExplore(router: ImperativeRouter): void {
  for (const genre of EXPLORE_GENRES) void queryClient.prefetchQuery(createChartQueryOptions(genre.id));
  void queryClient.prefetchQuery(createFollowedShowsQueryOptions());
  router.push('/podcasts/explore');
}
