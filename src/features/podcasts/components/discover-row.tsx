import React from 'react';
import { View } from 'react-native';

import { ChevronRight } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type DiscoverRowProps = {
  id: string;
  title: string;
  subtitle: string | null;
  artworkUrl: string | null;
  following: boolean;
  onPress: (id: string) => void;
};

/** A search result, or a pasted link to open: artwork, name, who makes it. */
function DiscoverRowBase({ id, title, subtitle, artworkUrl, following, onPress }: DiscoverRowProps) {
  const tokens = useThemeTokens();
  return (
    <Touchable className="flex-row items-center gap-4 px-6 py-3" onPress={() => onPress(id)} accessibilityRole="button" accessibilityLabel={title}>
      <PodcastArtwork uri={artworkUrl} size={56} recyclingKey={id} placeholderColor={tokens['--color-surface-tertiary']} />
      <View className="flex-1 gap-0.5">
        <ThemedText type="headlineSm" numberOfLines={2}>
          {title}
        </ThemedText>
        {following ? (
          <ThemedText type="labelSm" color={tokens['--color-primary']}>
            Following
          </ThemedText>
        ) : subtitle ? (
          <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <ChevronRight size={18} color={tokens['--color-muted-foreground']} />
    </Touchable>
  );
}

export const DiscoverRow = React.memo(DiscoverRowBase);
