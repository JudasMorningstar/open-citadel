import { like } from 'drizzle-orm';
import { create } from 'zustand';

import { db } from '@/db/client';
import { appSettings } from '@/db/schema';

/**
 * How someone first arrived at Podcasts.
 *
 * `pending` until they pick a door on the welcome screen: start fresh, or bring
 * their AntennaPod library over. After that the welcome never shows again,
 * even if they unsubscribe from everything.
 */
export type PodcastOnboarding = 'pending' | 'fresh' | 'imported';

/** Which side of the Library header switch is showing. */
export type LibraryTab = 'books' | 'podcasts' | 'blogs';

/**
 * The app-wide podcast preferences. The defaults are AntennaPod's own, so
 * someone moving across finds the player behaving the way they are used to:
 * back 10 seconds, forward 30, a refresh every 12 hours, new episodes to the
 * inbox, nothing downloaded or deleted without being asked.
 */
export type PodcastPrefs = {
  onboarding: PodcastOnboarding;
  libraryTab: LibraryTab;
  /**
   * Whether each side last opened on a Continue card. Its placeholder draws
   * one only if so: drawn regardless, a side with nothing part-finished showed
   * a hero that was not coming, then a second placeholder without it.
   */
  podcastsContinue: boolean;
  blogsContinue: boolean;
  newEpisodesAction: 'inbox' | 'queue' | 'nothing';
  autoDownload: boolean;
  /** Delete a download once its episode has been played to the end. */
  autoDeletePlayed: boolean;
  playbackSpeed: number;
  skipBackSec: number;
  skipForwardSec: number;
  refreshIntervalHours: number;
  /** The episode in the mini player, so it is still there after a restart. */
  nowPlayingEpisodeId: string | null;
};

const DEFAULTS: PodcastPrefs = {
  onboarding: 'pending',
  libraryTab: 'books',
  podcastsContinue: true,
  blogsContinue: false,
  newEpisodesAction: 'inbox',
  autoDownload: false,
  autoDeletePlayed: false,
  playbackSpeed: 1,
  skipBackSec: 10,
  skipForwardSec: 30,
  refreshIntervalHours: 12,
  nowPlayingEpisodeId: null,
};

const PREFIX = 'podcasts.';

type PrefsState = PodcastPrefs & {
  loaded: boolean;
  load: () => Promise<void>;
  set: <K extends keyof PodcastPrefs>(key: K, value: PodcastPrefs[K]) => void;
};

function decode<K extends keyof PodcastPrefs>(key: K, raw: string | undefined): PodcastPrefs[K] {
  if (raw === undefined) return DEFAULTS[key];
  const fallback = DEFAULTS[key];
  if (typeof fallback === 'number') {
    const n = Number(raw);
    return (Number.isFinite(n) ? n : fallback) as PodcastPrefs[K];
  }
  if (typeof fallback === 'boolean') return (raw === '1') as PodcastPrefs[K];
  if (key === 'nowPlayingEpisodeId') return (raw || null) as PodcastPrefs[K];
  return raw as PodcastPrefs[K];
}

function encode(value: PodcastPrefs[keyof PodcastPrefs]): string {
  if (typeof value === 'boolean') return value ? '1' : '0';
  return value == null ? '' : String(value);
}

/**
 * Podcast preferences, read before the first paint alongside the rest of the
 * settings, so the Library opens on the tab it was left on without a frame of
 * the other one.
 *
 * Writes are state first and persisted after: every one of these is the
 * direct response to a tap, and none should wait on SQLite.
 */
export const usePodcastPrefs = create<PrefsState>((set) => ({
  ...DEFAULTS,
  loaded: false,

  load: async () => {
    const rows = await db
      .select()
      .from(appSettings)
      .where(like(appSettings.key, `${PREFIX}%`));
    const map = Object.fromEntries(rows.map((r) => [r.key.slice(PREFIX.length), r.value]));
    const next = {} as Record<keyof PodcastPrefs, unknown>;
    for (const key of Object.keys(DEFAULTS) as (keyof PodcastPrefs)[]) {
      next[key] = decode(key, map[key]);
    }
    set({ ...(next as PodcastPrefs), loaded: true });
  },

  set: (key, value) => {
    set({ [key]: value } as Partial<PrefsState>);
    const stored = encode(value);
    db.insert(appSettings)
      .values({ key: `${PREFIX}${key}`, value: stored })
      .onConflictDoUpdate({ target: appSettings.key, set: { value: stored } })
      .run();
  },
}));

/** A read for services, outside React. */
export function podcastPrefs(): PodcastPrefs {
  return usePodcastPrefs.getState();
}
