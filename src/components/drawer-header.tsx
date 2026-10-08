import React from 'react';
import { View } from 'react-native';

import { IconButton } from '@/components/icon-button';
import { ChevronDown } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { contentColumn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type DrawerHeaderProps = {
  title: string;
  /** The count under the title, `12 BOOKS`. It belongs to the title, not to the buttons. */
  subtitle: string;
  onClose: () => void;
  /** Icon buttons on the right, in the order they appear. */
  children?: React.ReactNode;
};

/**
 * The header of a screen that rises as a drawer (a shelf's "View all", a
 * collection): close, title and count, and the screen's own actions.
 *
 * The close points down, not back. These screens arrive on the `drawer`
 * transition, the same one Settings uses, so they leave by going down, and
 * the control should point where the screen actually goes.
 */
export function DrawerHeader({ title, subtitle, onClose, children }: DrawerHeaderProps) {
  const tokens = useThemeTokens();
  return (
    <View className="flex-row items-center gap-3 px-4 py-4" style={contentColumn}>
      <IconButton onPress={onClose} label="Close">
        <ChevronDown size={20} color={tokens['--color-foreground']} strokeWidth={2} />
      </IconButton>
      <View className="flex-1">
        <ThemedText type="headlineSm" numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="labelSm" color={tokens['--color-muted-foreground']}>
          {subtitle}
        </ThemedText>
      </View>
      {children}
    </View>
  );
}
