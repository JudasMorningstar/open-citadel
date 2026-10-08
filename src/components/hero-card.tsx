import React from 'react';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';

/**
 * The hero card's height, the same for every card: the pager under it turns
 * without jumping whatever the titles run to. A floor, not a clamp, so large
 * text grows the card rather than being cut off by it.
 */
export const HERO_CARD_MIN_HEIGHT = 168;
const MIN = { minHeight: HERO_CARD_MIN_HEIGHT };

type HeroCardProps = {
  /** The media's width over its height: 1 for podcast artwork, 2/3 for a book cover. */
  mediaAspect: number;
  media: React.ReactNode;
  /** What it is: label, title, byline. */
  top: React.ReactNode;
  /** Where the reader or listener is in it, pinned to the card's foot. */
  bottom: React.ReactNode;
  onPress: () => void;
  onLongPress: () => void;
};

/**
 * The card that heads both Library pages, Continue Reading and Continue
 * Listening: the cover or artwork running the card's full height, flush to its
 * edge, and the text in a padded column with what it is at the top and the
 * progress at the foot. One shell, so the two libraries open the same way.
 */
export function HeroCard({ mediaAspect, media, top, bottom, onPress, onLongPress }: HeroCardProps) {
  const mediaBox = { aspectRatio: mediaAspect, alignSelf: 'stretch' as const };
  return (
    <Touchable onPress={onPress} onLongPress={onLongPress}>
      <Card className="flex-row overflow-hidden p-0" style={MIN}>
        <View className="overflow-hidden bg-muted" style={mediaBox}>
          {media}
        </View>
        <View className="flex-1 justify-between gap-3 p-4">
          {top}
          {bottom}
        </View>
      </Card>
    </Touchable>
  );
}
