import React from 'react';
import { useCSSVariable } from 'uniwind';

import { fabPosition } from '@/components/fab-placement';
import type { LucideIcon } from '@/components/icons';
import { Fab } from '@/components/ui/fab';
import { useFabBottom } from '@/hooks/use-fab-bottom';
import { asColor } from '@/utils/colors';

type ScreenFabProps = {
  icon: LucideIcon;
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * A screen's one creative action, floating in its corner: a new thought, a new
 * podcast. The same button on every screen that has one, in the same place
 * (`useFabBottom`), so it holds still as the hub's pages swipe past.
 */
export function ScreenFab({ icon: Icon, accessibilityLabel, onPress }: ScreenFabProps) {
  const ink = asColor(useCSSVariable('--color-primary-foreground'));
  const bottom = useFabBottom();
  const style = React.useMemo(() => fabPosition(bottom), [bottom]);
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
