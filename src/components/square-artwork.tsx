import { Image } from 'expo-image';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import type { LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { fontFamily, motion } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { COVER_PLACEHOLDER_BLURHASH } from '@/utils/colors';

type SquareArtworkProps = {
  uri: string | null;
  /** Drawn when there is no picture: the kind of thing this is (a microphone, a newspaper). */
  fallbackIcon: LucideIcon;
  /**
   * Initials set in the serif instead of the icon, for things that are
   * mostly known by name (a blog). From `monogramOf`.
   */
  monogram?: string | null;
  size: number;
  /** For lists: lets a recycled cell drop the previous row's image at once. */
  recyclingKey?: string;
  /** Resolved `--color-surface-tertiary`, for the empty mark. */
  placeholderColor?: string;
  /**
   * Fade the picture in as it loads, which suits a list filling in. Off for
   * artwork that has to be there the moment it is (the player's, growing out
   * of the mini player's): a fade there reads as a ghost of it.
   */
  fadeIn?: boolean;
  style?: StyleProp<ViewStyle>;
};

const FILL = { width: '100%' as const, height: '100%' as const };

/**
 * A show's, an episode's, a blog's or a post's picture: square, like every
 * corner in the app.
 *
 * Podcast and reader apps round their artwork almost without exception, and
 * it is the quickest way to tell this one belongs to Open Citadel that it
 * does not. Artwork is drawn at the size it is shown (expo-image downsamples
 * on decode), so a shelf of forty shows costs forty thumbnails rather than
 * forty posters.
 */
function SquareArtworkBase({
  uri,
  fallbackIcon: Fallback,
  monogram,
  size,
  recyclingKey,
  placeholderColor,
  fadeIn = true,
  style,
}: SquareArtworkProps) {
  const tokens = useThemeTokens();
  const letters = { fontFamily: fontFamily.serifMedium, fontSize: Math.round(size * 0.34), lineHeight: Math.round(size * 0.42) };
  return (
    <View className="overflow-hidden border border-border bg-muted" style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri, width: size, height: size }}
          style={FILL}
          contentFit="cover"
          placeholder={{ blurhash: COVER_PLACEHOLDER_BLURHASH }}
          transition={fadeIn ? motion.slow : 0}
          recyclingKey={recyclingKey}
          cachePolicy="memory-disk"
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          {monogram ? (
            <ThemedText color={tokens['--color-muted-foreground']} style={letters} accessible={false}>
              {monogram}
            </ThemedText>
          ) : (
            <Fallback size={Math.round(size * 0.36)} color={placeholderColor} strokeWidth={1.5} />
          )}
        </View>
      )}
    </View>
  );
}

export const SquareArtwork = React.memo(SquareArtworkBase);
