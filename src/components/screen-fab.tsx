import React from 'react';
import { useCSSVariable } from 'uniwind';

import { FabLift } from '@/components/fab-lift';
import type { LucideIcon } from '@/components/icons';
import { Fab } from '@/components/ui/fab';
import { asColor } from '@/utils/colors';

type ScreenFabProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * A screen's one creative action, floating in its corner: a new thought, a new
 * podcast. The same button on every screen that has one, in the same place
 * (`FabLift`), so it holds still as the hub's pages swipe past, and rides
 * up and down with the mini player.
 */
export function ScreenFab({ icon: Icon, accessibilityLabel, onPress }: ScreenFabProps) {
  const ink = asColor(useCSSVariable('--color-primary-foreground'));
  return (
    <FabLift>
      {(position) => (
        <Fab
          placement="bottom-right"
          icon={<Icon size={24} color={ink} strokeWidth={1.8} />}
          accessibilityLabel={accessibilityLabel}
          haptics
          style={position}
          onPress={onPress}
        />
      )}
    </FabLift>
  );
}
