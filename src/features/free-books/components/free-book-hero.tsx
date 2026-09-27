import { Image } from 'expo-image';
import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { elevation, motion } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { COVER_PLACEHOLDER_BLURHASH } from '@/utils/colors';

const COVER = { width: 150, height: 225 } as const;

export type FreeBookHeroProps = {
  title: string;
  author: string | null;
  coverUrl: string | null;
  actionLabel: string;
  /** What pressing the button will do, or why it cannot. */
  actionHint: string | null;
  loading: boolean;
  disabled: boolean;
  onAction: () => void;
};

/**
 * The top of a free book's page: its cover large, its title in the library's
 * serif, and the one thing the page is for, in gold. Download, then Read.
 */
export function FreeBookHero({ title, author, coverUrl, actionLabel, actionHint, loading, disabled, onAction }: FreeBookHeroProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <View className="gap-5 px-6 pb-6 pt-2">
      <View className="items-center">
        <View className="bg-card" style={[COVER, elevation.card]}>
          <Image source={coverUrl ?? undefined} style={COVER} placeholder={{ blurhash: COVER_PLACEHOLDER_BLURHASH }} transition={motion.slow} />
        </View>
      </View>
      <View className="items-center gap-1">
        <ThemedText type="headlineLg" className="text-center" numberOfLines={4}>
          {title}
        </ThemedText>
        {author ? (
          <ThemedText type="bodySm" color={muted} className="text-center" numberOfLines={2}>
            {author}
          </ThemedText>
        ) : null}
      </View>
      <View className="gap-2">
        <GoldButton label={actionLabel} size="compact" onPress={onAction} loading={loading} disabled={disabled} />
        {actionHint ? (
          <ThemedText type="bodySm" color={muted} className="text-center">
            {actionHint}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}
