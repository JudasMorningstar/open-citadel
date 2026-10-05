import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { useAddBlog } from '@/features/blogs/hooks/use-add-blog';
import { useArticleActions } from '@/features/blogs/hooks/use-article-actions';
import { useBlogImport } from '@/features/blogs/hooks/use-blog-import';
import { useContinueHint } from '@/features/library/hooks/use-continue-hint';
import {
  createBlogSectionQueryOptions,
  createFollowedFeedsQueryOptions,
  createBlogsHomeQueryOptions,
  invalidateBlogLibrary,
  type BlogSection,
  type BlogsHomeData,
} from '@/query-manager/blogs';
import { refreshAllBlogs } from '@/services/blogs/refresh';

/** What the blogs side draws: nothing for one frame, the welcome, or the shelves. */
export type BlogsPageView = 'loading' | 'welcome' | 'home';

const EMPTY: BlogsHomeData = { blogs: [], shelves: { continue: [], latest: [], queue: [], favorites: [], finished: [] } };

/**
 * The blogs side of the Library: which view it shows, and what its doors,
 * pull and shelves do.
 *
 * Opening it is when followed blogs are checked for new posts (those past
 * the interval only; a pull checks every one), which is when the reader
 * would look for them.
 */
export function useBlogsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data } = useQuery(createBlogsHomeQueryOptions());
  const home = data ?? EMPTY;
  const leadsWithContinue = useContinueHint('blogs', data ? data.shelves.continue.length > 0 : undefined);
  const articles = useArticleActions();
  const importer = useBlogImport();
  const addBlog = useAddBlog(articles.openBlog);
  const pull = useMutation({ mutationFn: () => refreshAllBlogs(true), onSettled: invalidateBlogLibrary });

  React.useEffect(() => {
    void refreshAllBlogs(false).then((summary) => {
      if (summary.refreshed > 0) invalidateBlogLibrary();
    });
  }, []);
  // Explore's directory is built in; what it reads is which blogs are followed.
  const openExplore = React.useCallback(() => {
    void queryClient.prefetchQuery(createFollowedFeedsQueryOptions());
    router.push('/blogs/explore');
  }, [queryClient, router]);
  const { mutate, isPending } = pull;
  const refresh = React.useCallback(() => {
    if (!isPending) mutate();
  }, [isPending, mutate]);
  const viewAll = React.useCallback(
    (section: BlogSection) => {
      void queryClient.prefetchQuery(createBlogSectionQueryOptions(section));
      router.push({ pathname: '/blogs/section/[type]', params: { type: section } });
    },
    [queryClient, router],
  );

  // Nothing kept here yet: no blog followed, and no post on any shelf.
  const empty = home.blogs.length === 0 && Object.values(home.shelves).every((shelf) => shelf.length === 0);
  const view: BlogsPageView = data === undefined ? 'loading' : empty ? 'welcome' : 'home';

  return {
    view,
    home,
    leadsWithContinue,
    articles,
    importer,
    addBlog,
    pulling: isPending,
    refresh,
    openExplore,
    viewAll,
  };
}
