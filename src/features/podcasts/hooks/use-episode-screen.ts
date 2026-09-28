import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Share } from 'react-native';

import { useEpisode } from '@/features/podcasts/hooks/use-episode';
import { playOrToggle } from '@/features/podcasts/hooks/use-episode-actions';
import * as actions from '@/services/podcasts/actions';
import { playEpisode, seekTo } from '@/services/podcasts/player';
import { showName } from '@/services/podcasts/records';
import { useEpisodePlayback, usePodcastPlayer } from '@/stores/podcast-player';

/**
 * An episode's page: the episode, its show, chapters and parsed notes, and
 * everything its controls do.
 */
export function useEpisodeScreen(id: string) {
  const router = useRouter();
  const { detail, chapters, notes, loaded } = useEpisode(id);
  const playback = useEpisodePlayback(id);
  const episode = detail?.episode ?? null;
  const show = detail?.show ?? null;
  const link = episode?.link ?? show?.link ?? null;

  /** A timestamp or chapter: jump there if this is the episode playing, otherwise start it there. */
  const playFrom = React.useCallback(
    (seconds: number) => {
      const player = usePodcastPlayer.getState();
      if (player.current?.episodeId === id && player.loaded) seekTo(seconds);
      else void playEpisode(id, seconds);
    },
    [id],
  );
  // Web links in the in-app browser; mail links to the mail app, which the
  // browser cannot open.
  const openLink = React.useCallback((url: string) => {
    if (/^mailto:/i.test(url)) void Linking.openURL(url).catch(() => {});
    else void WebBrowser.openBrowserAsync(url).catch(() => {});
  }, []);

  const back = React.useCallback(() => router.back(), [router]);
  const hero = {
    play: () => playOrToggle(id),
    openShow: () => show && router.push({ pathname: '/podcasts/show/[id]', params: { id: show.id } }),
    toggleQueue: () =>
      void (episode?.queuePosition == null ? actions.addToQueue([id], 'last') : actions.removeFromQueue([id])),
    download: () => void actions.download([id]),
    removeDownload: () => void actions.removeDownload([id]),
    toggleFavorite: () => void actions.setFavorite([id], !episode?.isFavorite),
    togglePlayed: () => void actions.markPlayed([id], episode?.playState !== 'played'),
  };

  return {
    loaded,
    episode,
    showTitle: show ? showName(show) : '',
    artworkUrl: episode?.imageUrl ?? show?.imageUrl ?? null,
    playback,
    chapters,
    notes,
    playFrom,
    openLink,
    hero,
    back,
    /** Sharing needs somewhere to send people: the episode's page, or the show's. */
    share: link && episode ? () => void Share.share({ message: `${episode.title}\n${link}` }).catch(() => {}) : null,
  };
}
