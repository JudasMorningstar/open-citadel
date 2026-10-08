/**
 * Where a web page says its feed is. Pure.
 *
 * Sites announce their feed in the page head (`<link rel="alternate"
 * type="application/rss+xml">`), which is how every reader finds a feed from
 * a site's address. When a page announces nothing, the paths blog platforms
 * put their feeds at are worth a try before giving up.
 */
import { decodeEntities } from '@/utils/html-entities';
import { originOf, resolveUrl } from '@/utils/urls';

const FEED_TYPES = ['application/rss+xml', 'application/atom+xml', 'application/rdf+xml', 'application/xml', 'text/xml'];

const LINK_TAG = /<link\b[^>]*>/gi;

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  if (!match) return null;
  return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '').trim() || null;
}

/**
 * The feeds a page names, best first: RSS and Atom before anything vaguer,
 * and in page order within a type. Comment feeds ("Comments on…") are left
 * out, since a reader following a blog wants its posts.
 */
export function feedLinksInPage(html: string, pageUrl: string): string[] {
  const head = html.split(/<\/head>/i)[0];
  const found: { url: string; rank: number; order: number }[] = [];
  let order = 0;
  for (const tag of head.match(LINK_TAG) ?? []) {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase().split(/\s+/);
    const type = (attribute(tag, 'type') ?? '').toLowerCase();
    const href = attribute(tag, 'href');
    const title = (attribute(tag, 'title') ?? '').toLowerCase();
    if (!rel.includes('alternate') || !href) continue;
    const rank = FEED_TYPES.indexOf(type);
    if (rank === -1 || /comment/.test(title) || /\/comments\/feed/.test(href)) continue;
    const url = resolveUrl(href, pageUrl);
    if (url && /^https?:/i.test(url)) found.push({ url, rank, order: order++ });
  }
  const sorted = found.sort((a, b) => a.rank - b.rank || a.order - b.order).map((f) => f.url);
  return [...new Set(sorted)];
}

/** The paths WordPress, Ghost, Substack, Hugo, Jekyll and friends publish feeds at. */
const COMMON_PATHS = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml', '/feed/atom'];

/** Addresses worth trying on a site that names no feed. */
export function guessedFeedUrls(pageUrl: string): string[] {
  const origin = originOf(pageUrl);
  return origin ? COMMON_PATHS.map((path) => `${origin}${path}`) : [];
}
