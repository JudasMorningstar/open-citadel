/**
 * From whatever someone pasted to a blog's feed.
 *
 * A feed address works as it is. A site's address works too: the page is
 * read for the feed it announces, and when it announces none, the paths blog
 * platforms use are tried in turn. Read You stops at the announcement; most
 * people paste the site, and plenty of sites never announce.
 */
import { BlogFeedError, looksLikeFeed, parseBlogFeed, type ParsedBlog } from '@/services/blogs/feed-parser';
import { feedLinksInPage, guessedFeedUrls } from '@/services/blogs/feed-links';
import { directoryIcon, findSiteIcon } from '@/services/blogs/site-icon';
import { fetchFeed, fetchPage, normalizeFeedUrl } from '@/services/feeds/fetch';

export type DiscoveredBlog = {
  /**
   * The feed's address as it was asked for, not where redirects ended up: it
   * is how the blog is known (Explore's "Following", finding it again), and a
   * fetch follows the redirects every time anyway.
   */
  feedUrl: string;
  validator: string | null;
  blog: ParsedBlog;
};

async function tryFeed(url: string, signal?: AbortSignal): Promise<DiscoveredBlog | null> {
  try {
    const result = await fetchFeed(url, null, signal);
    if (result.status !== 'ok' || !looksLikeFeed(result.xml)) return null;
    return { feedUrl: url, validator: result.validator, blog: parseBlogFeed(result.xml, result.url) };
  } catch {
    if (signal?.aborted) throw new BlogFeedError('Cancelled.');
    return null;
  }
}

/**
 * The blog's picture: the directory's icon for a blog Explore offers (so it
 * looks the same followed as it did there), else the feed's own image, else
 * its site's home-screen icon.
 */
async function withPicture(found: DiscoveredBlog, signal?: AbortSignal): Promise<DiscoveredBlog> {
  const curated = directoryIcon(found.feedUrl);
  if (curated) return { ...found, blog: { ...found.blog, imageUrl: curated } };
  if (found.blog.imageUrl || !found.blog.siteUrl) return found;
  const icon = await findSiteIcon(found.blog.siteUrl, signal);
  return icon ? { ...found, blog: { ...found.blog, imageUrl: icon } } : found;
}

async function findFeed(url: string, signal?: AbortSignal): Promise<DiscoveredBlog> {
  const page = await fetchPage(url, signal);
  if (looksLikeFeed(page.body)) {
    return { feedUrl: url, validator: null, blog: parseBlogFeed(page.body, page.url) };
  }

  for (const candidate of [...feedLinksInPage(page.body, page.url), ...guessedFeedUrls(page.url)]) {
    const found = await tryFeed(candidate, signal);
    if (found) return found;
  }
  throw new BlogFeedError('No feed was found at this address. Try the link to the blog itself, or its feed.');
}

export async function discoverBlog(input: string, signal?: AbortSignal): Promise<DiscoveredBlog> {
  return withPicture(await findFeed(normalizeFeedUrl(input), signal), signal);
}
