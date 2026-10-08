/**
 * RSS 2.0 and Atom podcast feeds, read into plain objects.
 *
 * The namespaces are the ones AntennaPod's parser handles (`parser/feed/
 * namespace`): iTunes for artwork, authors and durations, `content:encoded`
 * for the long show notes, Podlove Simple Chapters for inline chapters,
 * Podcasting 2.0 for chapter and transcript files, funding and a stable feed
 * GUID, and Media RSS as a fallback enclosure.
 *
 * Pure: no React Native, no I/O. It takes the feed's text and gives back what
 * it said, so the whole thing is covered by tests against real-world shapes.
 */
import { XMLParser } from "fast-xml-parser";

import { parseAtom } from "@/services/podcasts/feed/atom";
import { parseRss } from "@/services/podcasts/feed/rss";
import type { ParsedFeed } from "@/services/podcasts/feed/types";
import { isNode, type Node } from "@/services/feeds/xml";

export type { ParsedChapter, ParsedEpisode, ParsedFeed } from "@/services/podcasts/feed/types";
export { parseChapterStart, parseDuration } from "@/services/podcasts/feed/values";

export class FeedParseError extends Error {}

/** Elements that can repeat, so they always come back as arrays. */
const ALWAYS_ARRAY = new Set([
  "rss.channel.item",
  "feed.entry",
  "feed.link",
  "feed.entry.link",
  "rss.channel.item.psc:chapters.psc:chapter",
  "rss.channel.item.podcast:transcript",
  "rss.channel.item.media:content",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Everything stays a string: a show called "1984" is a title, not a number.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
  isArray: (_name, jpath) => ALWAYS_ARRAY.has(String(jpath)),
});

export function parseFeed(xml: string): ParsedFeed {
  let doc: Node;
  try {
    doc = parser.parse(xml) as Node;
  } catch (err) {
    throw new FeedParseError(err instanceof Error ? err.message : "The feed could not be read.");
  }
  if (isNode(doc.rss) && isNode(doc.rss.channel)) return parseRss(doc.rss.channel);
  if (isNode(doc.feed)) return parseAtom(doc.feed);
  throw new FeedParseError("This link is not a podcast feed.");
}
