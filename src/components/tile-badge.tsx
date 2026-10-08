import React from 'react';
import { View } from 'react-native';

import { CircleCheckBig, CircleStar } from '@/components/icons';

/**
 * A badge's icon: the component, not an element, so a tile's `memo` holds
 * (an element is a new object on every render of the shelf).
 */
export type TileBadgeIcon = React.ComponentType<{ size?: number; color?: string }>;

/** The marks a shelf puts on its tiles, the same for a book, an episode and a post. */
export const FAVORITE_BADGE: TileBadgeIcon = CircleStar;
export const FINISHED_BADGE: TileBadgeIcon = CircleCheckBig;

/** The mark over a tile artwork's top-left corner, for a shelf that flags what it holds. */
export function TileBadge({ icon: Icon, color }: { icon: TileBadgeIcon; color: string | undefined }) {
  return (
    <View className="absolute left-2 top-2 rounded-full bg-background">
      <Icon size={22} color={color} />
    </View>
  );
}
