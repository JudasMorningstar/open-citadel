import React from 'react';
import { View } from 'react-native';

import type { LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { SquareArtwork } from '@/components/square-artwork';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

const TILE_PADDING = 16;

type FeedTileProps = {
  id: string;
  /** Drawn when there is no artwork. */
  fallbackIcon: LucideIcon;
  /** Initials drawn instead of the icon, for things known by name. */
  monogram?: string | null;
  title: string;
  author: string | null;
  artworkUrl: string | null;
  /** Things waiting in it (new episodes, unread posts); a gold count over the artwork when there are any. */
  newCount?: number;
  /** Already followed, for one met in Explore. */
  following?: boolean;
  width: number;
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;
};

/**
 * One followed thing on a shelf or in a grid, a show or a blog: the same
 * panel as an episode or a book, so every shelf in the Library is built from
 * one kind of object.
 */
function FeedTileBase({ id, fallbackIcon, monogram, title, author, artworkUrl, newCount = 0, following, width, onPress, onLongPress }: FeedTileProps) {
  const tokens = useThemeTokens();
  const art = width - TILE_PADDING * 2;
  return (
    <Touchable
      style={{ width }}
      onPress={() => onPress(id)}
      onLongPress={onLongPress && (() => onLongPress(id))}
      accessibilityRole="button"
      accessibilityLabel={newCount > 0 ? `${title}, ${newCount} new` : title}
    >
      <View className="gap-3 bg-tile p-4">
        <View className="shadow-sm">
          <SquareArtwork uri={artworkUrl} fallbackIcon={fallbackIcon} monogram={monogram} size={art} recyclingKey={id} placeholderColor={tokens['--color-surface-tertiary']} />
          {newCount > 0 ? (
            <View className="absolute right-0 top-0 min-w-6 items-center bg-primary px-1.5 py-0.5">
              <ThemedText type="labelSm" color={tokens['--color-background']}>
                {newCount > 99 ? '99+' : String(newCount)}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View className="gap-1">
          <ThemedText type="headlineSm" numberOfLines={2} style={{ minHeight: 48 }}>
            {title}
          </ThemedText>
          {/* One height either way: FOLLOWING is set smaller than a name, and a
              tile changing height when it learns it is followed moved every
              shelf below it. */}
          <View className="h-5 justify-center">
            <ThemedText
              type={following ? 'labelSm' : 'bodySm'}
              color={following ? tokens['--color-primary'] : tokens['--color-muted-foreground']}
              numberOfLines={1}
            >
              {following ? 'Following' : (author ?? ' ')}
            </ThemedText>
          </View>
        </View>
      </View>
    </Touchable>
  );
}

export const FeedTile = React.memo(FeedTileBase);
