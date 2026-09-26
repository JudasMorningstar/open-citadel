/** What a podcast feed says, as plain objects. */

export type ParsedChapter = {
  startSec: number;
  title: string;
  link: string | null;
  imageUrl: string | null;
};

export type ParsedEpisode = {
  guid: string | null;
  title: string;
  description: string | null;
  link: string | null;
  /** ISO 8601, or null when the feed gave no usable date. */
  pubDate: string | null;
  imageUrl: string | null;
  audioUrl: string;
  mimeType: string | null;
  durationSec: number;
  fileSize: number | null;
  chaptersUrl: string | null;
  transcriptUrl: string | null;
  transcriptType: string | null;
  chapters: ParsedChapter[];
};

export type ParsedFeed = {
  type: "rss" | "atom";
  title: string;
  author: string | null;
  description: string | null;
  link: string | null;
  imageUrl: string | null;
  language: string | null;
  fundingUrl: string | null;
  feedIdentifier: string | null;
  episodes: ParsedEpisode[];
};
