import { useQuery } from '@tanstack/react-query';

import {
  createDiscoveredShowQueryOptions,
  createShowEpisodesQueryOptions,
  createShowQueryOptions,
} from '@/query-manager/podcasts';
import type { ShowEpisodeFilter } from '@/services/podcasts/episodes';
import type { EpisodeItem } from '@/services/podcasts/records';

/** What Explore already knows about a show, so its page can draw before the feed arrives. */
export type ShowPreview = {
  appleId: string | null;
  feedUrl: string | null;
  title: string;
  author: string | null;
  artworkUrl: string | null;
};

const NO_EPISODES: EpisodeItem[] = [];

/**
 * One show and its episodes, filtered and sorted, re-read whenever the
 * library changes.
 *
 * A show opened from Explore is not stored yet, and its page opens anyway:
 * the preview draws the hero from what Explore knew, and the feed is fetched
 * and stored behind it. The screen moves the moment it is tapped rather than
 * after a network round trip.
 */
export function useShow(id: string | null, preview: ShowPreview | null, filter: ShowEpisodeFilter, landed: boolean) {
  const discovered = useQuery(
    createDiscoveredShowQueryOptions(
      { appleId: preview?.appleId ?? null, feedUrl: preview?.feedUrl ?? null },
      // Not until the page has landed: storing a new show parses its whole
      // feed, often hundreds of episodes, on the JS thread, and doing that
      // mid-slide is what froze the way out of Explore.
      { enabled: landed && id === null && preview !== null },
    ),
  );
  const showId = id ?? discovered.data ?? null;

  const show = useQuery(createShowQueryOptions(showId ?? '', { enabled: showId !== null }));
  const sort = show.data?.episodeSort ?? 'newest';
  const episodes = useQuery(
    createShowEpisodesQueryOptions(showId ?? '', sort, filter, {
      enabled: showId !== null && show.data != null,
      // Keep the list on screen while a new filter or sort is read.
      placeholderData: (previous) => previous,
    }),
  );

  // Loading from the first frame, stored or not: a followed show must not
  // flash a FOLLOW button for the frame before its row is read.
  const resolving =
    (showId === null && preview !== null && !discovered.isError) ||
    // Re-checking a cached answer whose show is gone: still finding it.
    (id === null && discovered.isFetching && show.data == null) ||
    (showId !== null && show.isPending) ||
    (show.data != null && episodes.isPending);

  return {
    show: show.data ?? null,
    episodes: episodes.data ?? NO_EPISODES,
    resolving,
    error: discovered.error ? discovered.error.message || 'This show could not be loaded.' : null,
    showId,
  };
}
