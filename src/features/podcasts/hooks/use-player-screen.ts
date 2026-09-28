import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { usePlaybackClock, usePlaybackSeconds } from '@/features/podcasts/hooks/use-playback-clock';
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

/** "12:04" while a timed sleep counts down, "End" when set for the episode's end, null when off. */
function useSleepLabel(sleep: SleepTimer): string | null {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (sleep?.kind !== 'time') return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [sleep]);
  if (!sleep) return null;
  if (sleep.kind === 'episode') return 'End';
  return formatClock(Math.max(0, (sleep.endsAt - now) / 1000));
}

/**
 * Everything the full player draws, gathered in one place: the player's own
 * state, the episode as stored (for its favourite), its show (for a speed of
 * its own), its chapters and which one is playing, Up Next, and the sleep
 * countdown. The per-frame values come as shared values; nothing here renders
 * more than once a second.
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
  const episode = useQuery(createEpisodeItemQueryOptions(episodeId ?? '', { enabled: episodeId !== null })).data ?? null;
  const queue = useQuery(createPodcastSectionQueryOptions('queue')).data?.episodes ?? NO_EPISODES;
  const show = useQuery(createShowQueryOptions(podcastId ?? '', { enabled: podcastId !== null })).data ?? null;
  const chapters =
    useQuery(createChaptersQueryOptions(episodeId ?? '', { enabled: episodeId !== null })).data ?? NO_CHAPTERS;
  const showSpeed = show ? { title: show.customTitle || show.title, speed: show.playbackSpeed } : null;

  const clock = usePlaybackClock(current?.positionSec ?? 0, current?.durationSec ?? 0);
  const seconds = usePlaybackSeconds(current?.positionSec ?? 0);
  const currentChapter = React.useMemo(() => {
    let found: Chapter | null = null;
    for (const chapter of chapters) {
      if (chapter.startSec <= seconds.position + 0.5) found = chapter;
      else break;
    }
    return found;
  }, [chapters, seconds.position]);

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
    sleepLabel: useSleepLabel(sleep),
    skipBackSec,
    skipForwardSec,
    queue,
    chapters,
    currentChapter,
    clock,
  };
}
