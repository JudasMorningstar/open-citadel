/**
 * What a feed says, as column values: the show's, and each episode's. Only
 * what the publisher decides; never anything the listener did. Pure.
 */
import type { ParsedEpisode, ParsedFeed } from "@/services/podcasts/feed-parser";
import { summarizeShowNotes } from "@/services/podcasts/show-notes";

export function showColumns(feed: ParsedFeed) {
  return {
    title: feed.title,
    author: feed.author,
    description: feed.description,
    link: feed.link,
    imageUrl: feed.imageUrl,
    language: feed.language,
    feedType: feed.type,
    fundingUrl: feed.fundingUrl,
    feedIdentifier: feed.feedIdentifier,
  };
}

/**
 * `showColumns` without the fields this fetch left empty. A feed that drops
 * its artwork or author for one fetch (a broken CDN, a template bug) should
 * not wipe what was stored from the fetch before.
 */
export function presentShowColumns(feed: ParsedFeed) {
  return Object.fromEntries(
    Object.entries(showColumns(feed)).filter(([, value]) => value != null),
  ) as Partial<ReturnType<typeof showColumns>>;
}

/** What the publisher decides about an episode. Never the listener's state. */
export function publishedColumns(episode: ParsedEpisode) {
  return {
    guid: episode.guid,
    title: episode.title,
    description: episode.description,
    summary: summarizeShowNotes(episode.description),
    link: episode.link,
    pubDate: episode.pubDate,
    imageUrl: episode.imageUrl,
    audioUrl: episode.audioUrl,
    mimeType: episode.mimeType,
    fileSize: episode.fileSize,
    chaptersUrl: episode.chaptersUrl,
    transcriptUrl: episode.transcriptUrl,
    transcriptType: episode.transcriptType,
  };
}

export type StoredForMerge = {
  id: string;
  guid: string | null;
  audioUrl: string;
  title: string;
  pubDate: string | null;
  durationSec: number;
  mimeType: string | null;
  imageUrl: string | null;
  fileSize: number | null;
  chaptersUrl: string | null;
  notesLength: number;
};

/** Whether the publisher changed anything worth writing back about a stored episode. */
export function changed(stored: StoredForMerge, incoming: ParsedEpisode): boolean {
  return (
    stored.title !== incoming.title ||
    stored.audioUrl !== incoming.audioUrl ||
    stored.pubDate !== incoming.pubDate ||
    stored.imageUrl !== incoming.imageUrl ||
    stored.fileSize !== incoming.fileSize ||
    stored.chaptersUrl !== incoming.chaptersUrl ||
    stored.guid !== incoming.guid ||
    stored.notesLength !== (incoming.description?.length ?? 0) ||
    (incoming.durationSec > 0 && stored.durationSec !== incoming.durationSec)
  );
}
