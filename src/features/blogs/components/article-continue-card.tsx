import React from 'react';
import { View } from 'react-native';

import { HERO_CARD_MIN_HEIGHT, HeroCard } from '@/components/hero-card';
import { Newspaper } from '@/components/icons';
import { SquareArtwork } from '@/components/square-artwork';
import { ThemedText } from '@/components/themed-text';
import { Progress } from '@/components/ui/progress';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ArticleItem } from '@/services/blogs/records';
import { monogramOf } from '@/utils/monogram';

/** Fills the card's media box, edge to edge, with no frame of its own. */
const FILL = { width: '100%', height: '100%', borderWidth: 0 } as const;
const TABULAR = { fontVariant: ['tabular-nums' as const] };

type ArticleContinueCardProps = {
  article: ArticleItem;
  onPress: (article: ArticleItem) => void;
  onLongPress: (article: ArticleItem) => void;
};

/**
 * A post part-read, as the hero of the Blogs page, in the same card as a book
 * in the books' Continue Reading and an episode in Continue Listening: its picture runs
 * the card's full height, its blog in gold over its title, and how far in at
 * the foot, read the way a book's is.
 */
export const ArticleContinueCard = React.memo(function ArticleContinueCard({
  article,
  onPress,
  onLongPress,
}: ArticleContinueCardProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const progress = article.progress ?? 0;
  const percent = `${Math.round(progress * 100)}%`;
  const open = () => onPress(article);
  const menu = () => onLongPress(article);

  const media = (
    <SquareArtwork
      uri={article.imageUrl ?? article.blogImageUrl}
      fallbackIcon={Newspaper}
      monogram={monogramOf(article.blogTitle)}
      size={HERO_CARD_MIN_HEIGHT}
      placeholderColor={tokens['--color-surface-tertiary']}
      style={FILL}
    />
  );
  const top = (
    <View className="gap-1">
      <ThemedText type="labelSm" color={tokens['--color-primary']} numberOfLines={1}>
        {article.blogTitle}
      </ThemedText>
      <ThemedText type="headlineSm" numberOfLines={3}>
        {article.title}
      </ThemedText>
    </View>
  );
  const bottom = (
    <View className="gap-2">
      <Progress value={progress} minValue={0} maxValue={1} size="sm" />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText type="labelSm" color={muted}>
          PROGRESS
        </ThemedText>
        <ThemedText type="labelSm" color={tokens['--color-primary']} style={TABULAR}>
          {percent}
        </ThemedText>
      </View>
    </View>
  );

  return <HeroCard mediaAspect={1} media={media} top={top} bottom={bottom} onPress={open} onLongPress={menu} />;
});
