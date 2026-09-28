import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';

import { looksLikeAddress, searchDirectory } from '@/features/blogs/utils/explore';
import { backTo } from '@/navigation/navigate';
import { createFollowedFeedsQueryOptions } from '@/query-manager/blogs';
import { BLOG_DIRECTORY, DIRECTORY_BLOGS, type DirectoryBlog } from '@/services/blogs/directory';

/** What Explore shows under its search field. */
export type BlogsExploreView = 'search' | 'sections';

const NO_FEEDS = new Set<string>();

/**
 * Blogs' Explore: the directory's sections, a search over it as typing
 * pauses, and any address typed opening that blog's page to read before
 * following. Nothing here waits on the network; only opening a blog does.
 */
export function useBlogsExplore() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const { data: followed = NO_FEEDS } = useQuery(createFollowedFeedsQueryOptions());

  const term = query.trim();
  const results = React.useMemo(() => searchDirectory(DIRECTORY_BLOGS, term), [term]);
  const address = looksLikeAddress(term) ? term : null;

  const openBlog = React.useCallback(
    (blog: Pick<DirectoryBlog, 'feedUrl' | 'title'>) =>
      router.push({ pathname: '/blogs/blog/[id]', params: { id: 'found', feedUrl: blog.feedUrl, title: blog.title } }),
    [router],
  );
  const openAddress = React.useCallback(() => {
    if (address) openBlog({ feedUrl: address, title: '' });
  }, [address, openBlog]);

  const view: BlogsExploreView = term ? 'search' : 'sections';
  const searchEmptyText = address ? null : `No blogs here match “${term}”. Paste a blog's address to follow any other.`;

  return {
    view,
    setQuery,
    clearQuery: () => setQuery(''),
    sections: BLOG_DIRECTORY,
    followed,
    results,
    address,
    searchEmptyText,
    openBlog,
    openAddress,
    close: () => backTo(router, '/'),
  };
}
