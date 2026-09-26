import React from 'react';
import { View } from 'react-native';

import { Headphones } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { contentColumn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

/**
 * No shows followed. Says what would be here and how to put something here,
 * and sits above whatever shelves do still have something (favourites and
 * history outlive an unfollow).
 */
export function NoShowsYet({ onExplore }: { onExplore: () => void }) {
  const tokens = useThemeTokens();
  return (
    <View className="mb-8 gap-4 px-6" style={contentColumn}>
      <Headphones size={28} color={tokens['--color-primary']} />
      <ThemedText type="headlineMd">Nothing to listen to yet</ThemedText>
      <ThemedText type="bodyMd" color={tokens['--color-muted-foreground']}>
        Follow a few shows and their new episodes will be waiting here, with whatever you are part-way
        through at the top.
      </ThemedText>
      <GoldButton label="EXPLORE PODCASTS" size="compact" onPress={onExplore} />
    </View>
  );
}
