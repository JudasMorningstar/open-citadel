import React from 'react';
import { View } from 'react-native';

import { Star } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { iconSize } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PlayerTitleProps = {
  title: string;
  showTitle: string;
  favorite: boolean;
  onOpenShow: () => void;
  onToggleFavorite: () => void;
};

/** What is playing and whose it is, with the favourite star at its side. */
export function PlayerTitle({ title, showTitle, favorite, onOpenShow, onToggleFavorite }: PlayerTitleProps) {
  const tokens = useThemeTokens();
  return (
    <View className="flex-row items-start gap-3">
      <View className="flex-1 gap-1">
        <ThemedText type="headlineMd" numberOfLines={2}>
          {title}
        </ThemedText>
        <Touchable onPress={onOpenShow} hitSlop={6} accessibilityRole="link" accessibilityLabel={`Go to ${showTitle}`}>
          <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} numberOfLines={1}>
            {showTitle}
          </ThemedText>
        </Touchable>
      </View>
      <Touchable
        className="h-10 w-10 items-center justify-center"
        haptic="tap"
        onPress={onToggleFavorite}
        accessibilityRole="button"
        accessibilityLabel={favorite ? 'Remove from Favorites' : 'Add to Favorites'}
        accessibilityState={{ selected: favorite }}
      >
        {/* Filled when it is one: an outline in gold read as an offer, not a state. */}
        <Star
          size={iconSize.default}
          color={favorite ? tokens['--color-primary'] : tokens['--color-muted-foreground']}
          fill={favorite ? tokens['--color-primary'] : 'none'}
        />
      </Touchable>
    </View>
  );
}
