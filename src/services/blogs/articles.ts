/**
 * Posts: the lists the Blogs side draws, one post, and marking one read or
 * saved. Lists never carry a post's HTML; only opening one reads it.
 */
import { and, desc, eq, getTableColumns, gt, isNotNull, isNull, lt, sql, type SQL } from 'drizzle-orm';

import { db } from '@/db/client';
import { blogArticles, blogs, readingProgress } from '@/db/schema';
import type { ArticleItem, Blog, BlogArticle } from '@/services/blogs/records';
import { nowIso } from '@/services/rows';

/**
 * `latest`: every followed blog's posts, newest first. `continue`: posts
 * opened and left part-read. `saved`: kept to read later, latest kept first.
 */
export type ArticleShelf = 'latest' | 'continue' | 'saved';
export type BlogArticleFilter = 'all' | 'unread';

const { contentHtml: _html, ...ITEM_COLUMNS } = getTableColumns(blogArticles);
const ITEM = { ...ITEM_COLUMNS, blogTitle: blogs.title, blogImageUrl: blogs.imageUrl, progress: readingProgress.percentage };

/** Read far enough to be under way, and not so far it is finished. */
const STARTED = 0.02;
const FINISHED = 0.95;

function select(where: SQL | undefined, order: SQL[], limit: number) {
  return db
    .select(ITEM)
    .from(blogArticles)
    .innerJoin(blogs, eq(blogs.id, blogArticles.blogId))
    .leftJoin(readingProgress, eq(readingProgress.bookId, blogArticles.bookId))
    .where(where)
    .orderBy(...order)
    .limit(limit);
}

export async function listShelf(shelf: ArticleShelf, limit: number): Promise<ArticleItem[]> {
  switch (shelf) {
    case 'latest':
      return select(eq(blogs.state, 'subscribed'), [desc(blogArticles.publishedAt)], limit);
    case 'saved':
      return select(isNotNull(blogArticles.savedAt), [desc(blogArticles.savedAt)], limit);
    case 'continue':
      return select(
        and(
          isNotNull(blogArticles.bookId),
          gt(readingProgress.percentage, STARTED),
          lt(readingProgress.percentage, FINISHED),
        ),
        [desc(readingProgress.updatedAt)],
        limit,
      );
  }
}

export async function listBlogArticles(blogId: string, filter: BlogArticleFilter, limit: number): Promise<ArticleItem[]> {
  const where = and(eq(blogArticles.blogId, blogId), filter === 'unread' ? isNull(blogArticles.readAt) : undefined);
  return select(where, [desc(blogArticles.publishedAt)], limit);
}

export type ArticleDetail = { article: BlogArticle; blog: Blog };

export async function getArticle(id: string): Promise<ArticleDetail | null> {
  const rows = await db
    .select({ article: blogArticles, blog: blogs })
    .from(blogArticles)
    .innerJoin(blogs, eq(blogs.id, blogArticles.blogId))
    .where(eq(blogArticles.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function setArticleRead(id: string, read: boolean): Promise<void> {
  await db
    .update(blogArticles)
    .set({ readAt: read ? nowIso() : null })
    .where(eq(blogArticles.id, id));
}

export async function setArticleSaved(id: string, saved: boolean): Promise<void> {
  await db
    .update(blogArticles)
    .set({ savedAt: saved ? nowIso() : null })
    .where(eq(blogArticles.id, id));
}

/** Everything in one blog read, or every followed blog's when no blog is named. */
export async function markAllRead(blogId?: string): Promise<void> {
  const unread = isNull(blogArticles.readAt);
  const scope = blogId
    ? eq(blogArticles.blogId, blogId)
    : sql`${blogArticles.blogId} in (select ${blogs.id} from ${blogs} where ${blogs.state} = 'subscribed')`;
  await db.update(blogArticles).set({ readAt: nowIso() }).where(and(unread, scope));
}
