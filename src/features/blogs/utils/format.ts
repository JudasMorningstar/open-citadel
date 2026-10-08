import type { ArticleItem } from '@/services/blogs/records';
import { formatPubDate } from '@/utils/pub-date';

/** `Farnam Street · Yesterday`, or just the date on the blog's own page. Pure. */
export function articleMeta(
  article: Pick<ArticleItem, 'blogTitle' | 'publishedAt'>,
  withBlog: boolean,
  now: Date = new Date(),
): string {
  const date = formatPubDate(article.publishedAt, now);
  return withBlog ? [article.blogTitle, date].filter(Boolean).join(' · ') : date;
}
