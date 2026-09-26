import React from 'react';

import { useShow, type ShowPreview } from '@/features/podcasts/hooks/use-show';
import { useShowMutations } from '@/features/podcasts/hooks/use-show-mutations';
import * as actions from '@/services/podcasts/actions';
import type { ShowEpisodeFilter } from '@/services/podcasts/episodes';
import { showName, type EpisodeItem } from '@/services/podcasts/records';
import { playEpisode } from '@/services/podcasts/player';
import { showNotesToText } from '@/services/podcasts/show-notes';

/** A show page's route params: a stored id, or `discover` with what Explore knew. */
export type ShowParams = {
  id: string;
  appleId?: string;
  feedUrl?: string;
  title?: string;
  author?: string;
  artworkUrl?: string;
};

/**
 * Everything a show's page decides: which show (stored, or previewed from
 * Explore), its derived facts (name, plain description, newest episode, how
 * many are new), and following, leaving and refreshing it.
 */
export function useShowScreen(params: ShowParams, landed: boolean) {
  const [filter, setFilter] = React.useState<ShowEpisodeFilter>('all');

  const isDiscover = params.id === 'discover';
  const { appleId, feedUrl, title: previewTitle, author, artworkUrl } = params;
  const preview = React.useMemo<ShowPreview | null>(
    () =>
      isDiscover
        ? {
            appleId: appleId ?? null,
            feedUrl: feedUrl ?? null,
            title: previewTitle ?? '',
            author: author ?? null,
            artworkUrl: artworkUrl ?? null,
          }
        : null,
    [isDiscover, appleId, feedUrl, previewTitle, author, artworkUrl],
  );
  const data = useShow(isDiscover ? null : params.id, preview, filter, landed);
  const { show, episodes, showId } = data;

  const title = show ? showName(show) : (preview?.title ?? '');
  const description = React.useMemo(() => showNotesToText(show?.description), [show?.description]);
  const newCount = React.useMemo(() => episodes.filter((e) => e.playState === 'new').length, [episodes]);
  const latest = React.useMemo(
    () => episodes.reduce<EpisodeItem | null>((a, e) => (!a || (e.pubDate ?? '') > (a.pubDate ?? '') ? e : a), null),
    [episodes],
  );

  const mutations = useShowMutations(showId, title);

  const playLatest = React.useCallback(() => latest && void playEpisode(latest.id), [latest]);
  const setSort = React.useCallback(
    (episodeSort: 'newest' | 'oldest') => show && void actions.updateShowSettings(show.id, { episodeSort }),
    [show],
  );
  const markAllSeen = React.useCallback(() => show && void actions.markShowSeen(show.id), [show]);

  const emptyText = !show
    ? null
    : filter === 'all'
      ? 'This show has not published any episodes yet.'
      : 'No episodes match.';

  return {
    ...data,
    filter,
    setFilter,
    setSort,
    markAllSeen,
    refreshing: mutations.refreshing,
    title,
    newCount,
    emptyText,
    hero: {
      title,
      author: show?.author ?? preview?.author ?? null,
      artworkUrl: show?.imageUrl ?? preview?.artworkUrl ?? null,
      description,
      following: show?.state === 'subscribed',
      loading: data.resolving,
      canFollow: showId !== null,
      refreshError: data.error ?? (show?.lastRefreshFailed ? show.lastRefreshError : null),
      canPlayLatest: latest !== null,
    },
    follow: mutations.follow,
    unfollow: mutations.unfollow,
    refresh: mutations.refresh,
    playLatest,
  };
}
