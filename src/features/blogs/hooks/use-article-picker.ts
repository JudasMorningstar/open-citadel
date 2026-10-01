import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { useOpenArticle } from '@/features/blogs/hooks/use-open-article';
import { createAskableArticlesQueryOptions } from '@/query-manager/blogs';
import type { ArticleItem } from '@/services/blogs/records';

type PickedArticle = { id: string; title: string; kind: 'article' };

/**
 * Samwell's post picker: whether it is open, the posts it lists (read only
 * once it has been opened), and picking one, which makes the post's reader
 * copy first, since that copy is what the chat is grounded in.
 */
export function useArticlePicker(onPicked: (post: PickedArticle) => void) {
  const [visible, setVisible] = React.useState(false);
  const { data } = useQuery({ ...createAskableArticlesQueryOptions(), enabled: visible });
  const { prepareArticle } = useOpenArticle();

  const close = React.useCallback(() => setVisible(false), []);
  const select = React.useCallback(
    async (article: ArticleItem) => {
      setVisible(false);
      const bookId = await prepareArticle(article);
      if (bookId) onPicked({ id: bookId, title: article.title, kind: 'article' });
    },
    [onPicked, prepareArticle],
  );

  return { setVisible, sheet: { visible, articles: data, onSelect: select, onClose: close } };
}
