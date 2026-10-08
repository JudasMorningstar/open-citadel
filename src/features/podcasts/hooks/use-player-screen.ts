import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { useCurrentChapter } from '@/features/podcasts/hooks/use-current-chapter';
import { usePlaybackClock } from '@/features/podcasts/hooks/use-playback-clock';
import { formatClock, formatSpeed } from '@/features/podcasts/utils/format';
import {
  createChaptersQueryOptions,
  createEpisodeItemQueryOptions,
  createPodcastSectionQueryOptions,
  createShowQueryOptions,
  type Chapter,
} from '@/query-manager/podcasts';
import type { EpisodeItem } from '@/services/podcasts/records';
import { selectPlaying, usePlayerLoader, usePodcastPlayer, type SleepTimer } from '@/stores/podcast-player';
import { usePodcastPrefs } from '@/stores/podcast-prefs';

const NO_EPISODES: EpisodeItem[] = [];
const NO_CHAPTERS: Chapter[] = [];

/**
 * "12:04" while a timed sleep counts down, "End" when set for the episode's
 * end, null when off. Counts only while `ticking` (the player has landed): a
 * tick renders the whole player, which its opening has no room for.
 */
function useSleepLabel(sleep: SleepTimer, ticking: boolean): string | null {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (sleep?.kind !== 'time' || !ticking) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [sleep, ticking]);
  if (!sleep) return null;
  if (sleep.kind === 'episode') return 'End';
  return formatClock(Math.max(0, (sleep.endsAt - now) / 1000));
}

/**
 * Everything the full player draws, gathered in one place: the player's own
 * state, the episode as stored (for its favourite), its show (for a speed of
 * its own), its chapters and which one is playing, Up Next, and the sleep
 * countdown. The per-frame values come as shared values, and nothing here
 * renders on a clock: only when something it shows changes.
 *
 * `landed` is false while the player is still opening. What is already in the
 * cache is drawn from the first frame (the mini player reads these ahead, see
 * `useMiniPlayer`), but nothing is fetched and the native player is not asked
 * anything until the screen has stopped moving: each answer rendered the whole
 * player again in the middle of its own opening, which is what made it stutter.
 */
export function usePlayerScreen(landed: boolean) {
  const current = usePodcastPlayer((s) => s.current);
  // Playing or about to be: set on the press, so the icon answers at once. The
  // loader only for a wait long enough to notice.
  const isPlaying = usePodcastPlayer(selectPlaying);
  const isBuffering = usePlayerLoader();
  const speed = usePodcastPlayer((s) => s.speed);
  const sleep = usePodcastPlayer((s) => s.sleep);
  const error = usePodcastPlayer((s) => s.error);
  const skipBackSec = usePodcastPrefs((s) => s.skipBackSec);
  const skipForwardSec = usePodcastPrefs((s) => s.skipForwardSec);
  const episodeId = current?.episodeId ?? null;
  const podcastId = current?.podcastId ?? null;

  // The same cache entries the episode page, Up Next's "View all" and the
  // show page read, so opening the player after any of them costs nothing.
  const episode =
    useQuery(createEpisodeItemQueryOptions(episodeId ?? '', { enabled: landed && episodeId !== null })).data ?? null;
  const queue = useQuery(createPodcastSectionQueryOptions('queue', { enabled: landed })).data?.episodes ?? NO_EPISODES;
  const show = useQuery(createShowQueryOptions(podcastId ?? '', { enabled: landed && podcastId !== null })).data ?? null;
  const chapters =
    useQuery(createChaptersQueryOptions(episodeId ?? '', { enabled: landed && episodeId !== null })).data ?? NO_CHAPTERS;
  const showSpeed = show ? { title: show.customTitle || show.title, speed: show.playbackSpeed } : null;

  const clock = usePlaybackClock(current?.positionSec ?? 0, current?.durationSec ?? 0);
  const currentChapter = useCurrentChapter(chapters, current?.positionSec ?? 0, landed);

  return {
    current,
    episode,
    isPlaying,
    isBuffering,
    error,
    speed,
    speedLabel: formatSpeed(speed),
    showOverride: showSpeed?.speed != null ? showSpeed.title : null,
    sleep,
    sleepLabel: useSleepLabel(sleep, landed),
    skipBackSec,
    skipForwardSec,
    queue,
    chapters,
    currentChapter,
    clock,
  };
}
