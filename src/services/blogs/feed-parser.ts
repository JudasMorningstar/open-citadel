/**
 * A blog's feed, read into plain objects: RSS 2.0, RSS 1.0 (RDF) and Atom,
 * with the namespaces blogs actually use (`content:encoded` for the whole
 * post, Dublin Core for authors and dates, Media RSS for pictures).
 *
 * Pure: no React Native, no I/O. It takes the feed's text and gives back what
 * it said, so it is covered by tests against real-world shapes.
 */
import { XMLParser } from 'fast-xml-parser';

import { parseAtom, parseRssLike } from '@/services/blogs/feed/formats';
import type { ParsedBlog } from '@/services/blogs/feed/types';
import { isNode, type Node } from '@/services/feeds/xml';

export type { ParsedArticle, ParsedBlog } from '@/services/blogs/feed/types';

export class BlogFeedError extends Error {}

/** Elements that can repeat, so they always come back as arrays. */
const ALWAYS_ARRAY = new Set([
  'rss.channel.item',
  'rdf:RDF.item',
  'feed.entry',
  'feed.link',
  'feed.entry.link',
  'rss.channel.item.enclosure',
  'rss.channel.item.media:content',
  'rss.channel.item.media:thumbnail',
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Everything stays a string: a post called "1984" is a title, not a number.
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
  processEntities: true,
  htmlEntities: true,
  isArray: (_name, jpath) => ALWAYS_ARRAY.has(String(jpath)),
  // Kept raw, because Atom may carry a post as inline XHTML, which parsed
  // would come back as a tree of nodes rather than the post. Decoded by its
  // declared type in `atomText`.
  stopNodes: ['feed.entry.content', 'feed.entry.summary'],
});

/**
 * Whether this text is a feed at all, cheaply, before parsing: the start of
 * a web page is HTML, the start of a feed names its root element.
 */
export function looksLikeFeed(body: string): boolean {
  const head = body.slice(0, 2000).toLowerCase();
  return /<(rss|feed|rdf:rdf)[\s>]/.test(head) && !/<html[\s>]/.test(head.split(/<(rss|feed|rdf:rdf)[\s>]/)[0]);
}

/**
 * `feedUrl` is where the feed came from, so relative links in it can be read.
 * `now` dates posts that have no date, and caps those dated in the future.
 */
export function parseBlogFeed(xml: string, feedUrl: string | null, now = new Date()): ParsedBlog {
  let doc: Node;
  try {
    doc = parser.parse(xml) as Node;
  } catch (err) {
    throw new BlogFeedError(err instanceof Error ? err.message : 'The feed could not be read.');
  }
  if (isNode(doc.rss) && isNode(doc.rss.channel)) {
    const channel = doc.rss.channel;
    return parseRssLike(channel, Array.isArray(channel.item) ? channel.item.filter(isNode) : [], 'rss', feedUrl, now);
  }
  const rdf = doc['rdf:RDF'];
  if (isNode(rdf) && isNode(rdf.channel)) {
    return parseRssLike(rdf.channel, Array.isArray(rdf.item) ? rdf.item.filter(isNode) : [], 'rdf', feedUrl, now);
  }
  if (isNode(doc.feed)) return parseAtom(doc.feed, feedUrl, now);
  throw new BlogFeedError('This link is not a blog feed.');
}
