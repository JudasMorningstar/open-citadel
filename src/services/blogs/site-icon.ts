/**
 * A blog's picture, when its feed has none: the square icon its site
 * publishes for phones' home screens, the same idea as Read You's icon finder.
 */
import { DIRECTORY_BLOGS } from '@/services/blogs/directory';
import { fetchPage } from '@/services/feeds/fetch';
import { decodeEntities } from '@/utils/html-entities';
import { resolveUrl } from '@/utils/urls';

/** Smaller than this is a favicon, which looks blurred on a tile. */
const MIN_SIZE = 120;

function attribute(tag: string, name: string): string | null {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return match ? decodeEntities(match[2] ?? match[3] ?? '').trim() || null : null;
}

/**
 * The page's icons worth drawing, best first: home-screen icons (made square
 * and large for exactly this), then other icons that say they are large
 * enough. Never an `.ico` or an SVG, which the image loader draws poorly or
 * not at all. Pure.
 */
export function iconsInPage(html: string, pageUrl: string): string[] {
  const head = html.split(/<\/head>/i)[0];
  const found: { url: string; rank: number; size: number }[] = [];
  for (const tag of head.match(/<link\b[^>]*>/gi) ?? []) {
    const rel = (attribute(tag, 'rel') ?? '').toLowerCase();
    const href = attribute(tag, 'href');
    if (!href || /\.(ico|svg)(\?|$)/i.test(href)) continue;
    const size = Number((attribute(tag, 'sizes') ?? '').match(/^(\d+)x/i)?.[1] ?? 0);
    const touch = rel.includes('apple-touch-icon');
    if (!touch && !(rel.split(/\s+/).includes('icon') && size >= MIN_SIZE)) continue;
    const url = resolveUrl(href, pageUrl);
    if (url && /^https?:/i.test(url)) found.push({ url, rank: touch ? 0 : 1, size: size || (touch ? 180 : 0) });
  }
  return found.sort((a, b) => a.rank - b.rank || b.size - a.size).map((f) => f.url);
}

/** The icon Explore's directory draws for this feed, when it is one of its blogs. */
export function directoryIcon(feedUrl: string): string | null {
  return DIRECTORY_BLOGS.find((b) => b.feedUrl === feedUrl)?.imageUrl ?? null;
}

/** The site's best icon, or null when it has none worth drawing or cannot be reached. */
export async function findSiteIcon(siteUrl: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const page = await fetchPage(siteUrl, signal);
    return iconsInPage(page.body, page.url)[0] ?? null;
  } catch {
    return null;
  }
}
