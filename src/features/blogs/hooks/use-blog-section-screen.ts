import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { showToast } from '@/components/toast/toast-provider';
import { useArticleActions } from '@/features/blogs/hooks/use-article-actions';
import { isBlogSection, SECTION_TITLES } from '@/features/blogs/utils/sections';
import { createBlogSectionQueryOptions, invalidateBlogLibrary, type BlogSection } from '@/query-manager/blogs';
import { markAllRead } from '@/services/blogs/articles';
import { exportBlogOpml } from '@/services/blogs/opml';
import type { ArticleItem, BlogItem } from '@/services/blogs/records';
import { countLabel, matchesQuery } from '@/utils/format';

const NO_ARTICLES: ArticleItem[] = [];
const NO_BLOGS: BlogItem[] = [];

/**
 * A blogs shelf's "View all": every post (or blog) on it, searchable, with
 * the count under the title and the shelf's one bulk action: marking the
 * latest posts read, or exporting the blogs followed.
 */
export function useBlogSectionScreen(type: string | undefined) {
  const router = useRouter();
  const section: BlogSection = isBlogSection(type) ? type : 'latest';
  const { data } = useQuery(createBlogSectionQueryOptions(section));
  const articles = useArticleActions();
  const [query, setQuery] = React.useState('');

  const allArticles = data?.articles ?? NO_ARTICLES;
  const allBlogs = data?.blogs ?? NO_BLOGS;
  const filteredArticles = React.useMemo(
    () => allArticles.filter((a) => matchesQuery(query, a.title, a.blogTitle, a.summary)),
    [allArticles, query],
  );
  const filteredBlogs = React.useMemo(
    () => allBlogs.filter((b) => matchesQuery(query, b.title, b.description)),
    [allBlogs, query],
  );

  const isBlogs = section === 'blogs';
  const hasUnread = section === 'latest' && allArticles.some((a) => a.readAt === null);
  const markRead = React.useCallback(() => void markAllRead().then(invalidateBlogLibrary), []);
  const exportBlogs = React.useCallback(() => {
    void exportBlogOpml().catch(() => showToast({ message: 'The export could not be made.' }));
  }, []);

  return {
    title: SECTION_TITLES[section],
    subtitle: isBlogs ? countLabel(allBlogs.length, 'BLOG') : countLabel(allArticles.length, 'POST'),
    isBlogs,
    loaded: data !== undefined,
    articles: filteredArticles,
    blogs: filteredBlogs,
    actions: articles,
    setQuery,
    emptyText: query ? 'No results.' : 'Nothing here yet.',
    close: () => router.back(),
    /** Only when there is something to act on. */
    markAllRead: hasUnread ? markRead : null,
    exportBlogs: isBlogs && allBlogs.length > 0 ? exportBlogs : null,
  };
}
