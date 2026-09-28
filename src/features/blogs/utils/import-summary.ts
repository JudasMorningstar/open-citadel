import type { BlogImportProgress, BlogImportResult } from '@/services/blogs/opml';

/** `Following 12 of 48 blogs`: the running count in the import's toast. Pure. */
export function importProgressLabel({ done, total }: BlogImportProgress): string {
  return `Following ${done} of ${total} ${total === 1 ? 'blog' : 'blogs'}`;
}

/** What the import says when it lands, saying plainly what did not come across. Pure. */
export function importOutcome({ added, failed }: BlogImportResult): string {
  const followed = `Now following ${added} ${added === 1 ? 'blog' : 'blogs'}.`;
  if (failed.length === 0) return followed;
  if (added === 0) return `None of the ${failed.length === 1 ? 'blog' : `${failed.length} blogs`} could be reached. Check your connection and try again.`;
  return `${followed} ${failed.length} could not be reached.`;
}
