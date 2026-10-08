/** Atom feeds, which a few podcasts still publish. */
import type { ParsedEpisode, ParsedFeed } from "@/services/podcasts/feed/types";
import { parseFeedDate } from "@/services/feeds/dates";
import { parseDuration, positiveInt } from "@/services/podcasts/feed/values";
import { attr, isNode, text, type Node } from "@/services/feeds/xml";

function atomLink(links: unknown, rel: string): Node | null {
  if (!Array.isArray(links)) return null;
  return (
    links.find((l) => isNode(l) && (attr(l, "rel") ?? "alternate") === rel && attr(l, "href")) ?? null
  );
}

export function parseAtom(feed: Node): ParsedFeed {
  const entries = Array.isArray(feed.entry) ? feed.entry : [];
  const author = isNode(feed.author) ? text(feed.author.name) : null;
  const episodes: ParsedEpisode[] = [];
  for (const entry of entries) {
    if (!isNode(entry)) continue;
    const enclosure = atomLink(entry.link, "enclosure");
    const audioUrl = attr(enclosure, "href");
    if (!audioUrl) continue;
    episodes.push({
      guid: text(entry.id),
      title: text(entry.title) ?? "Untitled episode",
      description: text(entry.content) ?? text(entry.summary),
      link: attr(atomLink(entry.link, "alternate"), "href"),
      pubDate: parseFeedDate(text(entry.published) ?? text(entry.updated)),
      imageUrl: attr(entry["itunes:image"], "href"),
      audioUrl,
      mimeType: attr(enclosure, "type"),
      durationSec: parseDuration(text(entry["itunes:duration"])),
      fileSize: positiveInt(attr(enclosure, "length")),
      chaptersUrl: null,
      transcriptUrl: null,
      transcriptType: null,
      chapters: [],
    });
  }
  return {
    type: "atom",
    title: text(feed.title) ?? "Untitled podcast",
    author,
    description: text(feed.subtitle),
    link: attr(atomLink(feed.link, "alternate"), "href"),
    imageUrl: text(feed.logo) ?? text(feed.icon) ?? attr(feed["itunes:image"], "href"),
    language: attr(feed, "xml:lang"),
    fundingUrl: null,
    feedIdentifier: text(feed.id),
    episodes,
  };
}
