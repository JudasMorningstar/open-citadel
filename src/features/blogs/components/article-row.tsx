import React from 'react';
import { View } from 'react-native';

import { Ellipsis, Newspaper } from '@/components/icons';
import { SquareArtwork } from '@/components/square-artwork';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { articleMeta } from '@/features/blogs/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ArticleItem } from '@/services/blogs/records';
import { monogramOf } from '@/utils/monogram';

/** The episode row's artwork size, so a list of posts and a list of episodes read alike. */
const ART = 56;

type ArticleRowProps = {
  article: ArticleItem;
  /** Lists across blogs name each post's blog; a blog's own page does not. */
  withBlog: boolean;
  onPress: (article: ArticleItem) => void;
  onMenu: (article: ArticleItem) => void;
};

/**
 * A post in a list, laid out as an episode row is: its picture (the post's,
 * or its blog's, or the blog's initials) beside its blog, date and title in
 * the library's serif, the first lines of it under them across the row, and
 * how far in it is read with the menu at the foot.
 *
 * A read post dims to the secondary ink rather than disappearing, so a blog's
 * page still reads as its whole run; an unread one carries the small gold
 * square new episodes do.
 *
 * Every branch sets its value, because FlashList recycles rows.
 */
function ArticleRowBase({ article, withBlog, onPress, onMenu }: ArticleRowProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const unread = article.readAt === null;
  const fraction = article.progress ?? 0;

  return (
    <Touchable onPress={() => onPress(article)} onLongPress={() => onMenu(article)}>
      <View className="gap-3 px-6 py-5">
        <View className="flex-row gap-3">
          <SquareArtwork
            uri={article.imageUrl ?? article.blogImageUrl}
            fallbackIcon={Newspaper}
            monogram={monogramOf(article.blogTitle)}
            size={ART}
            recyclingKey={article.id}
            placeholderColor={tokens['--color-surface-tertiary']}
          />
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              {unread ? <View className="h-2 w-2 bg-primary" accessibilityLabel="Unread" /> : null}
              <ThemedText type="labelSm" color={muted} numberOfLines={1} className="flex-1">
                {articleMeta(article, withBlog)}
              </ThemedText>
            </View>
            <ThemedText type="headlineSm" numberOfLines={2} color={unread ? undefined : muted}>
              {article.title}
            </ThemedText>
          </View>
        </View>
        {article.summary ? (
          <ThemedText type="bodySm" color={muted} numberOfLines={2}>
            {article.summary}
          </ThemedText>
        ) : null}
        <View className="flex-row items-center gap-3">
          {fraction > 0 ? (
            <View className="h-[3px] w-12 bg-muted">
              <View className="h-full bg-primary" style={{ width: `${fraction * 100}%` }} />
            </View>
          ) : null}
          <View className="flex-1" />
          <Touchable
            className="h-10 w-10 items-center justify-center"
            hitSlop={4}
            onPress={() => onMenu(article)}
            accessibilityRole="button"
            accessibilityLabel="More"
          >
            <Ellipsis size={20} color={muted} />
          </Touchable>
        </View>
      </View>
    </Touchable>
  );
}

export const ArticleRow = React.memo(ArticleRowBase);
