/** The blog row types, and the shapes lists draw them in. */
import type { blogArticles, blogs } from '@/db/schema';

export type Blog = typeof blogs.$inferSelect;
export type BlogArticle = typeof blogArticles.$inferSelect;

/**
 * A post as a list draws it: everything but its HTML (which can run to
 * hundreds of kilobytes and is only read when the post is opened), plus the
 * few facts about its blog a row needs.
 */
export type ArticleItem = Omit<BlogArticle, 'contentHtml'> & {
  blogTitle: string;
  blogImageUrl: string | null;
  /** How far into its reader copy, 0..1; null until it is opened. */
  progress: number | null;
};

/** A blog as a shelf draws it, with how many posts have come since it was followed and are unread. */
export type BlogItem = Blog & { newCount: number };

/** How many of a blog's posts are kept, newest first. Posts kept on purpose (`keptOnPurpose`) are kept besides. */
export const KEEP_PER_BLOG = 200;
