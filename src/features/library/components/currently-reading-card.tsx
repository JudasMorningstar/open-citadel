import React from 'react';
import { View } from 'react-native';

import { CoverImage } from '@/components/cover-image';
import { HeroCard } from '@/components/hero-card';
import { ThemedText } from '@/components/themed-text';
import { Progress } from '@/components/ui/progress';
import { fontFamily } from '@/constants/theme';
import { useBookProgress } from '@/features/library/hooks/use-book-progress';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { Book } from '@/stores/books';

const COVER_FILL = { width: '100%' as const, height: '100%' as const };
const INITIAL = { fontSize: 36, fontFamily: fontFamily.serif };
const COVER_TITLE = { textAlign: 'center' as const, fontSize: 9 };
const TABULAR = { fontVariant: ['tabular-nums' as const] };

type CurrentlyReadingCardProps = {
  book: Book;
  onPress: (bookId: string) => void;
  onLongPress: (book: Book) => void;
};

/** A book with no cover: its initial, large, and its title small at the foot, on the cover's ground. */
function PlainCover({ title, ghost, muted }: { title: string; ghost?: string; muted?: string }) {
  return (
    <View className="flex-1 items-center justify-center">
      <ThemedText type="displayLg" color={ghost} style={INITIAL}>
        {title.charAt(0).toUpperCase()}
      </ThemedText>
      <ThemedText type="labelSm" color={muted} className="absolute bottom-2 px-2" style={COVER_TITLE} numberOfLines={2}>
        {title}
      </ThemedText>
    </View>
  );
}

/**
 * A book being read, as the hero of the Library, in the same card as an
 * episode in Continue Listening: the cover runs the card's full height, flush
 * to its edge, and the progress sits at the foot.
 */
export const CurrentlyReadingCard = React.memo(function CurrentlyReadingCard({
  book,
  onPress,
  onLongPress,
}: CurrentlyReadingCardProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const progress = useBookProgress(book.id);
  const percent = `${Math.round(progress * 100)}%`;
  const open = () => onPress(book.id);
  const menu = () => onLongPress(book);

  const media = book.coverUrl ? (
    <CoverImage source={{ uri: book.coverUrl }} style={COVER_FILL} contentFit="cover" />
  ) : (
    <PlainCover title={book.title} ghost={tokens['--color-surface-tertiary']} muted={muted} />
  );
  const top = (
    <View className="gap-1">
      {book.category ? (
        <ThemedText type="labelSm" color={tokens['--color-primary']} numberOfLines={1}>
          {book.category}
        </ThemedText>
      ) : null}
      <ThemedText type="headlineSm" numberOfLines={2}>
        {book.title}
      </ThemedText>
      <ThemedText type="bodySm" color={muted} numberOfLines={1}>
        {book.author}
      </ThemedText>
    </View>
  );
  // Below the bar, the same way the Compass insights card reads. `Progress`
  // only draws its own labels above it, and above is where the title is.
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

  return <HeroCard mediaAspect={2 / 3} media={media} top={top} bottom={bottom} onPress={open} onLongPress={menu} />;
});
