import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { ArticleTile } from '@/features/blogs/components/article-tile';
import type { ArticleItem } from '@/services/blogs/records';

type ArticleShelfProps = {
  articles: ArticleItem[];
  onPress: (article: ArticleItem) => void;
  onLongPress: (article: ArticleItem) => void;
};

const keyOf = (article: ArticleItem) => article.id;

/** A horizontal row of posts. At most a shelf's worth; "View all" has the rest. */
export const ArticleShelf = React.memo(function ArticleShelf({ articles, onPress, onLongPress }: ArticleShelfProps) {
  const renderTile = React.useCallback(
    (article: ArticleItem) => (
      <ArticleTile article={article} width={SHELF_TILE_WIDTH} onPress={onPress} onLongPress={onLongPress} />
    ),
    [onLongPress, onPress],
  );
  return <ShelfRow items={articles} keyOf={keyOf} renderTile={renderTile} />;
});
