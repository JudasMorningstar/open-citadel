/**
 * The things a reader does to blogs that go to the network first: open one
 * found in Explore, and follow one by its address.
 */
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { blogs } from '@/db/schema';
import { invalidateBlogLibrary } from '@/query-manager/blogs/invalidate';
import { storeDiscoveredBlog } from '@/services/blogs/blogs';
import { discoverBlog } from '@/services/blogs/discover';
import { isRefreshDue, refreshBlog } from '@/services/blogs/refresh';
import { normalizeFeedUrl } from '@/services/feeds/fetch';

/**
 * A blog from Explore, stored as a preview so its posts can be opened: its id.
 * A blog already in the library comes straight from the database, with no
 * wait. A followed one is kept current by the Blogs side's refresh; a preview
 * is not in that, so one opened again past the interval is refreshed behind
 * its page, which also keeps it from being let go while it is being read.
 */
export async function openDiscoveredBlog(feedUrl: string, signal?: AbortSignal): Promise<string> {
  const existing = db.select().from(blogs).where(eq(blogs.feedUrl, normalizeFeedUrl(feedUrl))).get();
  if (existing) {
    if (existing.state === 'preview' && isRefreshDue(existing)) {
      void refreshBlog(existing).then(invalidateBlogLibrary);
    }
    return existing.id;
  }
  return storeDiscoveredBlog(await discoverBlog(feedUrl, signal), 'preview');
}

/** Follows whatever someone pasted: a feed, or a site with a feed. Its id. */
export async function followByAddress(input: string, signal?: AbortSignal): Promise<string> {
  const url = normalizeFeedUrl(input);
  const existing = db.select({ id: blogs.id, state: blogs.state }).from(blogs).where(eq(blogs.feedUrl, url)).get();
  if (existing?.state === 'subscribed') return existing.id;
  return storeDiscoveredBlog(await discoverBlog(url, signal), 'subscribed');
}
