import { Image, type ImageProps } from 'expo-image';
import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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
 * shape behind it until it has loaded.
 *
 * Every picture used to wait on the same blurhash, one colourful blur for all
 * of them, so each one visibly went from blur to sharp even when it came from
 * the cache. A skeleton says "loading" in the same voice as the rest of the
 * page, and is gone once the picture is in (or has failed, when the box's own
 * ground shows).
 *
 * The skeleton is a plain block and does not pulse. It did, each cover with a
 * pulsing layer of its own, and a list builds covers as it scrolls: every
 * tile that came into view mounted an animated layer, and dropped it a moment
 * later when its picture (usually already in memory) arrived. That is the
 * work a list recycles its cells to avoid, done once per cover per scroll, on
 * every shelf of every Explore page. A page waiting on its data still
 * breathes: that is its own skeleton, one layer for the whole of it.
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
  // its skeleton would stay for good: the box's own ground is its cover.
  const loading = image.source != null && settledKey !== key;
  return (
    <View style={style}>
      {loading ? <View className="absolute inset-0 bg-skeleton" /> : null}
      <Image {...image} style={StyleSheet.absoluteFill} onLoad={settle} onError={settle} />
    </View>
  );
}

export const CoverImage = React.memo(CoverImageBase);
