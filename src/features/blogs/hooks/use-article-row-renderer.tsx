import React from 'react';

import { ArticleRow } from '@/features/blogs/components/article-row';
import type { ArticleItem } from '@/services/blogs/records';

type RowHandlers = {
  openArticle: (article: ArticleItem) => void;
  openMenu: (article: ArticleItem) => void;
};

/**
 * A list's `renderItem` for post rows, wired the same way wherever posts are
 * listed. Stable across renders, so recycled rows keep their memo.
 */
export function useArticleRowRenderer({ openArticle, openMenu }: RowHandlers, { withBlog }: { withBlog: boolean }) {
  return React.useCallback(
    ({ item }: { item: ArticleItem }) => (
      <ArticleRow article={item} withBlog={withBlog} onPress={openArticle} onMenu={openMenu} />
    ),
    [openArticle, openMenu, withBlog],
  );
}
