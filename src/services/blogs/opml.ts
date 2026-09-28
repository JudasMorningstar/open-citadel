/**
 * Blogs in and out as OPML, the file every feed reader exports: the way in
 * from Read You, Feedly, Inoreader or NetNewsWire, and the way out to any of
 * them, so nobody's reading list is locked in here.
 */
import { followByAddress } from '@/services/blogs/actions';
import type { OpmlFeed } from '@/services/feeds/opml';

export type BlogImportProgress = { done: number; total: number };
export type BlogImportResult = { added: number; failed: OpmlFeed[] };

const CONCURRENCY = 4;

/** Follows every feed in the file, four at a time, carrying on past any that fail. */
export async function importBlogOpml(
  feeds: OpmlFeed[],
  onProgress: (progress: BlogImportProgress) => void,
): Promise<BlogImportResult> {
  const result: BlogImportResult = { added: 0, failed: [] };
  const pending = [...feeds];
  let done = 0;
  onProgress({ done, total: feeds.length });
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pending.length) }, async () => {
      while (pending.length > 0) {
        const feed = pending.shift()!;
        try {
          await followByAddress(feed.feedUrl);
          result.added += 1;
        } catch {
          result.failed.push(feed);
        }
        done += 1;
        onProgress({ done, total: feeds.length });
      }
    }),
  );
  return result;
}

/**
 * Writes every followed blog to an OPML file and opens the share sheet on it.
 * Returns how many blogs went into it.
 */
export async function exportBlogOpml(): Promise<number> {
  // Loaded on use, like the podcasts' export.
  const { cacheDirectory, writeAsStringAsync } = await import('expo-file-system/legacy');
  const { shareAsync } = await import('expo-sharing');
  const { buildOpml } = await import('@/services/feeds/opml');
  const { listFollowedBlogs } = await import('@/services/blogs/blogs');
  const blogs = await listFollowedBlogs();
  if (blogs.length === 0) return 0;
  const uri = `${cacheDirectory}open-citadel-blogs.opml`;
  await writeAsStringAsync(
    uri,
    buildOpml(
      'Open Citadel blogs',
      blogs.map((b) => ({ title: b.title, feedUrl: b.feedUrl, siteUrl: b.siteUrl })),
    ),
  );
  await shareAsync(uri, { mimeType: 'text/x-opml', dialogTitle: 'Export blogs', UTI: 'public.xml' });
  return blogs.length;
}
