import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import type { TileBadgeIcon } from '@/components/tile-badge';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { ArticleTile } from '@/features/blogs/components/article-tile';
import type { ArticleItem } from '@/services/blogs/records';

type ArticleShelfProps = {
  articles: ArticleItem[];
  onPress: (article: ArticleItem) => void;
  onLongPress: (article: ArticleItem) => void;
  /** The mark every tile on this shelf carries, if any. */
  badgeIcon?: TileBadgeIcon;
};

const keyOf = (article: ArticleItem) => article.id;

/** A horizontal row of posts. At most a shelf's worth; "View all" has the rest. */
export const ArticleShelf = React.memo(function ArticleShelf({ articles, onPress, onLongPress, badgeIcon }: ArticleShelfProps) {
  const renderTile = React.useCallback(
    (article: ArticleItem) => (
      <ArticleTile
        article={article}
        width={SHELF_TILE_WIDTH}
        onPress={onPress}
        onLongPress={onLongPress}
        badgeIcon={badgeIcon}
      />
    ),
    [badgeIcon, onLongPress, onPress],
  );
  return <ShelfRow items={articles} keyOf={keyOf} renderTile={renderTile} />;
});
