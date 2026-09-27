import React from 'react';
import { useCSSVariable } from 'uniwind';

import { fabPosition } from '@/components/fab-placement';
import type { LucideIcon } from '@/components/icons';
import { Fab } from '@/components/ui/fab';
import { asColor } from '@/utils/colors';

type ScreenFabProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  /** Extra room below it, for the home indicator and anything else floating there. */
  bottomOffset?: number;
  onPress: () => void;
};

/**
 * A screen's one creative action, floating in its corner: a new thought, a new
 * podcast. The same button on every screen that has one, placed the same way.
 */
export function ScreenFab({ icon: Icon, accessibilityLabel, bottomOffset = 0, onPress }: ScreenFabProps) {
  const ink = asColor(useCSSVariable('--color-primary-foreground'));
  const style = React.useMemo(() => fabPosition(bottomOffset), [bottomOffset]);
  return (
    <Fab
      placement="bottom-right"
      icon={<Icon size={24} color={ink} strokeWidth={1.8} />}
      accessibilityLabel={accessibilityLabel}
      haptics
      style={style}
      onPress={onPress}
    />
  );
}
