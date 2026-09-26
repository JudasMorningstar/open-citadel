import { Image } from 'expo-image';
import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { MicSignal } from '@/components/icons';
import { motion } from '@/constants/theme';
import { COVER_PLACEHOLDER_BLURHASH } from '@/utils/colors';

type PodcastArtworkProps = {
  uri: string | null;
  size: number;
  /** For lists: lets a recycled cell drop the previous row's image at once. */
  recyclingKey?: string;
  /** Resolved `--color-surface-tertiary`, for the empty mark. */
  placeholderColor?: string;
  style?: StyleProp<ViewStyle>;
};

const FILL = { width: '100%' as const, height: '100%' as const };

/**
 * A show's or an episode's artwork: square, like every corner in the app.
 *
 * Podcast apps round their artwork almost without exception, and it is the
 * quickest way to tell this one belongs to Open Citadel that it does not.
 * Artwork is drawn at the size it is shown (expo-image downsamples on decode),
 * so a shelf of forty shows costs forty thumbnails rather than forty posters.
 */
function PodcastArtworkBase({ uri, size, recyclingKey, placeholderColor, style }: PodcastArtworkProps) {
  return (
    <View className="overflow-hidden border border-border bg-muted" style={[{ width: size, height: size }, style]}>
      {uri ? (
        <Image
          source={{ uri, width: size, height: size }}
          style={FILL}
          contentFit="cover"
          placeholder={{ blurhash: COVER_PLACEHOLDER_BLURHASH }}
          transition={motion.slow}
          recyclingKey={recyclingKey}
          cachePolicy="memory-disk"
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <MicSignal size={Math.round(size * 0.36)} color={placeholderColor} strokeWidth={1.5} />
        </View>
      )}
    </View>
  );
}

export const PodcastArtwork = React.memo(PodcastArtworkBase);
