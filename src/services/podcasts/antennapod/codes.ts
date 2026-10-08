/**
 * AntennaPod's stored values, read into ours. Pure: every function here takes
 * a raw column value (whatever SQLite handed back) and returns our type, with
 * AntennaPod's own default where the column is missing or empty.
 */
import type { EpisodePlayState, NewEpisodesAction, PodcastState, ShowSwitch } from "@/db/schema";

/** One row of a backup table, as SQLite hands it back. */
export type Row = Record<string, unknown>;

export function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

export function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** AntennaPod stores times as epoch milliseconds; 0 means never. */
export function msToIso(value: unknown): string | null {
  const ms = num(value);
  return ms > 0 ? new Date(ms).toISOString() : null;
}

export function playState(read: unknown): EpisodePlayState {
  const code = num(read);
  if (code === 1) return "played";
  if (code === -1) return "new";
  return "unplayed";
}

/** `FeedPreferences.AutoDownloadSetting`: 0 off, 2 on, 1 (and anything older) global. */
export function autoDownload(code: unknown): ShowSwitch {
  const n = num(code, 1);
  return n === 0 ? "off" : n === 2 ? "on" : "global";
}

/** `FeedPreferences.AutoDeleteAction`: 1 always, 2 never, 0 global. */
export function autoDelete(code: unknown): ShowSwitch {
  const n = num(code);
  return n === 1 ? "on" : n === 2 ? "off" : "global";
}

/** `FeedPreferences.NewEpisodesAction`: 1 inbox, 3 queue, 2 nothing, 0 global. */
export function newEpisodesAction(code: unknown): NewEpisodesAction {
  const n = num(code);
  return n === 1 ? "inbox" : n === 3 ? "queue" : n === 2 ? "nothing" : "global";
}

/** Tags are joined with the record separator; `#root` is AntennaPod's own. */
export function tags(raw: unknown): string | null {
  const list = (str(raw) ?? "")
    .split("\u001e")
    .map((t) => t.trim())
    .filter((t) => t && !t.startsWith("#"));
  return list.length > 0 ? JSON.stringify(list) : null;
}

/** A show's columns, from its `Feeds` row. `hasState` is false for a backup older than AntennaPod 3.5. */
export function showValuesFrom(feed: Row, hasState: boolean, now: string) {
  const state: PodcastState = hasState && num(feed.state) === 2 ? "archived" : "subscribed";
  const speed = num(feed.feed_playback_speed, -1);
  const minDuration = num(feed.minimal_duration_filter, -1);
  return {
    feedIdentifier: str(feed.feed_identifier),
    title: str(feed.title) ?? "Untitled podcast",
    customTitle: str(feed.custom_title),
    author: str(feed.author),
    description: str(feed.description),
    link: str(feed.link),
    imageUrl: str(feed.image_url),
    language: str(feed.language),
    feedType: str(feed.type) === "atom" ? ("atom" as const) : ("rss" as const),
    fundingUrl: str(feed.payment_link)?.split("\u001e")[0]?.split("\u001f")[0] ?? null,
    state,
    keepUpdated: num(feed.keep_updated, 1) === 0 ? 0 : 1,
    autoDownload: autoDownload(feed.auto_download),
    autoDelete: autoDelete(feed.auto_delete_action),
    newEpisodesAction: newEpisodesAction(feed.new_episodes_action),
    playbackSpeed: speed > 0 ? speed : null,
    skipIntroSec: num(feed.feed_skip_intro),
    skipEndingSec: num(feed.feed_skip_ending),
    includeFilter: str(feed.include_filter),
    excludeFilter: str(feed.exclude_filter),
    minDurationFilterSec: minDuration > 0 ? minDuration : null,
    tags: tags(feed.tags),
    episodeSort: str(feed.sort_order) === "1" ? ("oldest" as const) : ("newest" as const),
    // Refreshed on the first pass after import rather than trusting a
    // validator that belongs to another app's copy of the feed.
    lastRefreshAt: null,
    httpValidator: null,
    updatedAt: now,
  };
}

/** What the listener did with an episode, from its `FeedItems` and `FeedMedia` columns. */
export function listenerValuesFrom(item: Row, favorite: boolean) {
  return {
    playState: playState(item.read),
    positionSec: num(item.position) / 1000,
    playedDurationSec: num(item.played_duration) / 1000,
    lastPlayedAt: msToIso(item.last_played),
    completedAt: msToIso(item.completed),
    isFavorite: favorite ? 1 : 0,
    autoDownloadEligible: num(item.item_auto_download, 1) === 0 ? 0 : 1,
  };
}
