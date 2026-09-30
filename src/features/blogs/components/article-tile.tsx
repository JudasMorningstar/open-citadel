import React from 'react';
import { View } from 'react-native';

import { Newspaper } from '@/components/icons';
import { SquareArtwork } from '@/components/square-artwork';
import { ThemedText } from '@/components/themed-text';
import { TileBadge, type TileBadgeIcon } from '@/components/tile-badge';
import { Touchable } from '@/components/ui/touchable';
import { articleMeta } from '@/features/blogs/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ArticleItem } from '@/services/blogs/records';
import { monogramOf } from '@/utils/monogram';

/** `p-4` on the panel, both sides. The same panel a book or an episode tile sits on. */
const TILE_PADDING = 16;

type ArticleTileProps = {
  article: ArticleItem;
  width: number;
  onPress: (article: ArticleItem) => void;
  onLongPress: (article: ArticleItem) => void;
  /** A mark over the picture's corner, for a shelf that flags its posts (Favorites, Have Read). */
  badgeIcon?: TileBadgeIcon;
};

/**
 * One post on a shelf: the episode tile's panel, so a shelf of posts, of
 * episodes and of books are the same kind of object on the same ground. The
 * post's picture fills the panel's width, or its blog's initials when it has
 * none; how far in the reader is, is the gold line under it; an unread post
 * carries the small gold square new episodes do.
 *
 * Every branch sets its value, because FlashList recycles tiles.
 */
function ArticleTileBase({ article, width, onPress, onLongPress, badgeIcon }: ArticleTileProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const art = width - TILE_PADDING * 2;
  const fraction = article.progress ?? 0;
  const unread = article.readAt === null;
  const label = `${article.title}, ${article.blogTitle}${unread ? ', unread' : ''}`;

  return (
    <Touchable
      style={{ width }}
      onPress={() => onPress(article)}
      onLongPress={() => onLongPress(article)}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View className="gap-3 bg-tile p-4">
        <View className="shadow-sm">
          <SquareArtwork
            uri={article.imageUrl ?? article.blogImageUrl}
            fallbackIcon={Newspaper}
            monogram={monogramOf(article.blogTitle)}
            size={art}
            recyclingKey={article.id}
            placeholderColor={tokens['--color-surface-tertiary']}
          />
          {fraction > 0 ? (
            <View className="absolute bottom-0 left-0 right-0 h-[3px] bg-inset">
              <View className="h-full bg-primary" style={{ width: `${fraction * 100}%` }} />
            </View>
          ) : null}
          {badgeIcon ? <TileBadge icon={badgeIcon} color={tokens['--color-primary']} /> : null}
        </View>
        <View className="gap-1">
          <View className="flex-row items-center gap-2">
            {unread ? <View className="h-2 w-2 bg-primary" /> : null}
            <ThemedText type="labelSm" color={muted} numberOfLines={1} className="flex-1">
              {article.blogTitle}
            </ThemedText>
          </View>
          <ThemedText type="headlineSm" numberOfLines={3} style={{ minHeight: 72 }}>
            {article.title}
          </ThemedText>
          <ThemedText type="bodySm" color={muted} numberOfLines={1}>
            {articleMeta(article, false)}
          </ThemedText>
        </View>
      </View>
    </Touchable>
  );
}

export const ArticleTile = React.memo(ArticleTileBase);
