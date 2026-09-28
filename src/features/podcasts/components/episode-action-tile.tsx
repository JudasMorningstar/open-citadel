import React from 'react';

import type { LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';

export type EpisodeTile = {
  key: string;
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
  /** Drawn in the icon's place, for a mark that moves (a running download). */
  glyph?: React.ReactNode;
};

type EpisodeActionTileProps = {
  tile: EpisodeTile;
  gold: string | undefined;
  ink: string | undefined;
};

/** One of the things done to an episode besides playing it. */
export function EpisodeActionTile({ tile, gold, ink }: EpisodeActionTileProps) {
  const color = tile.active ? gold : ink;
  return (
    <Touchable
      className="flex-1 items-center gap-2 border border-border bg-card py-3 shadow-sm"
      onPress={tile.onPress}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={tile.label}
    >
      {tile.glyph ?? <tile.icon size={20} color={color} />}
      <ThemedText type="labelSm" color={color} numberOfLines={1}>
        {tile.label}
      </ThemedText>
    </Touchable>
  );
}
