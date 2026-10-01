import { Image, type ImageProps } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

type CoverImageProps = Omit<ImageProps, 'placeholder' | 'transition' | 'style' | 'onLoad' | 'onError'> & {
  /** The box the picture fills, and the shape its skeleton takes until it is in. */
  style?: StyleProp<ViewStyle>;
};

/** What identifies the picture asked for, so a recycled cell knows a new one is loading. */
function sourceKey(source: ImageProps['source']): string {
  if (typeof source === 'string') return source;
  if (source && typeof source === 'object' && !Array.isArray(source) && 'uri' in source) return String(source.uri);
  return String(source);
}

/**
 * A cover, a show's artwork or a post's picture, with a skeleton of its own
 * shape pulsing behind it until it has loaded.
 *
 * Every picture used to wait on the same blurhash, one colourful blur for all
 * of them, so each one visibly went from blur to sharp even when it came from
 * the cache. A skeleton says "loading" in the same voice as the rest of the
 * page, and is gone once the picture is in (or has failed, when the box's own
 * ground shows). It pulses on the shared skeleton clock, so a shelf of them
 * breathes as one.
 *
 * No fade in. The skeleton already says the picture is coming, and a fade
 * plays again whenever a tile is drawn anew, a picture already in memory
 * included: an Explore shelf taking over from its preview dimmed every cover
 * and brought it back.
 */
function CoverImageBase({ style, ...image }: CoverImageProps) {
  const key = sourceKey(image.source);
  // Keyed on the picture rather than a flag: a recycled list cell keeps its
  // state, and a flag would carry "loaded" over to the next row's picture.
  const [settledKey, setSettledKey] = React.useState<string | null>(null);
  const settle = React.useCallback(() => setSettledKey(key), [key]);
  // No picture at all (a free book without a cover) never loads or fails, so
  // its skeleton would pulse for good: the box's own ground is its cover.
  const loading = image.source != null && settledKey !== key;
  return (
    <View style={style}>
      {loading ? (
        <SkeletonGroup className="absolute inset-0">
          <SkeletonBar className="h-full w-full rounded-none" />
        </SkeletonGroup>
      ) : null}
      <Image {...image} style={StyleSheet.absoluteFill} onLoad={settle} onError={settle} />
    </View>
  );
}

export const CoverImage = React.memo(CoverImageBase);
