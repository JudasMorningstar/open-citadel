import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { motion } from '@/constants/theme';
import type { CatalogBook } from '@/services/gutenberg/records';
import { COVER_PLACEHOLDER_BLURHASH } from '@/utils/colors';

const COVER = { width: 40, height: 60 } as const;

type CatalogResultRowProps = {
  book: CatalogBook;
  mutedForeground: string | undefined;
  onPress: (id: number) => void;
};

/** A search result: the cover small, the title, who wrote it. */
export const CatalogResultRow = React.memo(function CatalogResultRow({ book, mutedForeground, onPress }: CatalogResultRowProps) {
  return (
    <Touchable
      className="flex-row items-center gap-4 px-6 py-3"
      onPress={() => onPress(book.id)}
      accessibilityRole="button"
      accessibilityLabel={book.title}
    >
      <View className="overflow-hidden bg-card shadow-sm" style={COVER}>
        <Image
          source={book.coverUrl ?? undefined}
          style={COVER}
          placeholder={{ blurhash: COVER_PLACEHOLDER_BLURHASH }}
          transition={motion.slow}
          recyclingKey={String(book.id)}
        />
      </View>
      <View className="flex-1 gap-0.5">
        <ThemedText type="headlineSm" numberOfLines={2}>
          {book.title}
        </ThemedText>
        {book.author ? (
          <ThemedText type="bodySm" color={mutedForeground} numberOfLines={1}>
            {book.author}
          </ThemedText>
        ) : null}
      </View>
      <ChevronRight size={18} color={mutedForeground} />
    </Touchable>
  );
});
