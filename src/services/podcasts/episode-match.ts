/**
 * Matching a refreshed feed against the episodes already stored.
 *
 * Publishers get this wrong all the time: they re-publish an episode under a
 * new GUID, list the same episode twice, or move files to a new CDN. A naive
 * "match on GUID" turns each of those into a duplicate episode, and a
 * duplicate is worse than a missing one because it arrives as new and splits
 * the listener's progress between two copies.
 *
 * So this follows AntennaPod's `FeedItemDuplicateGuesser`: an exact GUID
 * first, then the same audio URL, and only then a guess — the same title, on
 * the same day, of about the same length and the same kind of media. Pure, and
 * tested on its own.
 */
import type { ParsedEpisode } from "@/services/podcasts/feed-parser";

export type StoredEpisodeKey = {
  id: string;
  guid: string | null;
  audioUrl: string;
  title: string;
  pubDate: string | null;
  durationSec: number;
  mimeType: string | null;
};

export type MergePlan = {
  /** Stored episodes the feed still lists, with what it says about them now. */
  updates: { id: string; episode: ParsedEpisode }[];
  /** Episodes the feed lists that are not stored yet, newest first. */
  inserts: ParsedEpisode[];
};

/** Ten minutes, the slack AntennaPod allows between two cuts of one episode. */
const DURATION_SLACK_SEC = 10 * 60;

export function canonicalTitle(title: string): string {
  return title
    .trim()
    .replace(/[“”„]/g, '"')
    .replace(/[—–]/g, "-")
    .toLowerCase();
}

function sameDay(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  return a.slice(0, 10) === b.slice(0, 10);
}

function sameMediaKind(a: string | null, b: string | null): boolean {
  if (!a || !b) return true;
  return a.split("/")[0] === b.split("/")[0];
}

function looksLikeSameEpisode(stored: StoredEpisodeKey, incoming: ParsedEpisode): boolean {
  return (
    canonicalTitle(stored.title) === canonicalTitle(incoming.title) &&
    sameDay(stored.pubDate, incoming.pubDate) &&
    Math.abs(stored.durationSec - incoming.durationSec) < DURATION_SLACK_SEC &&
    sameMediaKind(stored.mimeType, incoming.mimeType)
  );
}

function newestFirst(a: ParsedEpisode, b: ParsedEpisode): number {
  return (b.pubDate ?? "").localeCompare(a.pubDate ?? "");
}

export function planEpisodeMerge(
  stored: StoredEpisodeKey[],
  incoming: ParsedEpisode[],
): MergePlan {
  const byGuid = new Map<string, StoredEpisodeKey>();
  const byUrl = new Map<string, StoredEpisodeKey>();
  for (const episode of stored) {
    if (episode.guid) byGuid.set(episode.guid, episode);
    byUrl.set(episode.audioUrl, episode);
  }

  const claimed = new Set<string>();
  const seenGuids = new Set<string>();
  const seenUrls = new Set<string>();
  const plan: MergePlan = { updates: [], inserts: [] };

  for (const episode of [...incoming].sort(newestFirst)) {
    // The same episode listed twice in one feed: the first copy wins.
    if ((episode.guid && seenGuids.has(episode.guid)) || seenUrls.has(episode.audioUrl)) continue;
    if (episode.guid) seenGuids.add(episode.guid);
    seenUrls.add(episode.audioUrl);

    let match =
      (episode.guid ? byGuid.get(episode.guid) : undefined) ?? byUrl.get(episode.audioUrl);
    if (match && claimed.has(match.id)) match = undefined;
    if (!match) {
      match = stored.find((s) => !claimed.has(s.id) && looksLikeSameEpisode(s, episode));
    }

    if (match) {
      claimed.add(match.id);
      plan.updates.push({ id: match.id, episode });
    } else {
      plan.inserts.push(episode);
    }
  }
  return plan;
}

/**
 * Whether a newly found episode was actually just published, as opposed to an
 * old one the publisher has only now added to the feed.
 *
 * Only the first kind gets the new-episode treatment (inbox, queue, download).
 * A back catalogue appearing all at once should not bury the inbox. The same
 * test AntennaPod uses: at or after the newest episode we already had.
 */
export function isFreshlyPublished(
  episode: ParsedEpisode,
  newestStoredPubDate: string | null,
): boolean {
  if (!episode.pubDate || !newestStoredPubDate) return true;
  return episode.pubDate >= newestStoredPubDate;
}
