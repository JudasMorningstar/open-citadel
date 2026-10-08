import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Touchable } from '@/components/ui/touchable';
import { contentColumn } from '@/constants/theme';

import { ThemedText } from '@/components/themed-text';

type SectionHeaderProps = {
  label?: string;
  title: string;
  rightAction?: {
    text: string;
    onPress: () => void;
  };
  rightIcon?: {
    icon: React.ReactNode;
    onPress: () => void;
  };
  count?: string;
};

export function SectionHeader({
  label,
  title,
  rightAction,
  rightIcon,
  count,
}: SectionHeaderProps) {
  // ThemedText's `color` prop takes a literal, never a className — both
  // tokens below feed that prop, the same way as everywhere else in this file.
  const primary = useCSSVariable('--color-primary');
  const mutedForeground = useCSSVariable('--color-muted-foreground');
  const primaryColor = typeof primary === 'string' ? primary : undefined;
  const secondaryColor = typeof mutedForeground === 'string' ? mutedForeground : undefined;

  return (
    // Capped to the shared content column: never bites at phone widths,
    // centres the header over the capped content on wide screens.
    <View
      className="gap-2 px-6"
      style={contentColumn}
    >
      {label && (
        <ThemedText type="labelSm" color={primaryColor}>
          {label}
        </ThemedText>
      )}
      {/* LOCAL EDIT (Open Citadel): `items-center`, not `items-baseline`.
          Android only knows a text's baseline once it has been laid out, so a
          header laid out fresh came out about 4dp taller than the same header
          laid out again, and everything below it moved whenever anything near
          it re-laid out: the Continue card jumping a second after the Library
          drew, Explore's shelves moving as their list took over. Centred, the
          row is the same height on every pass. Re-apply after an update. */}
      <View className="flex-row items-center gap-3">
        <ThemedText type="headlineSm" className="flex-1">
          {title}
        </ThemedText>
        {count && (
          <ThemedText type="labelSm" color={secondaryColor}>
            {count}
          </ThemedText>
        )}
        {rightIcon && (
          <Touchable onPress={rightIcon.onPress} className="h-7 w-7 items-center justify-center">
            {rightIcon.icon}
          </Touchable>
        )}
        {rightAction && (
          // A card, like every other button in the app: a surface a step off
          // its ground with the soft weight under it. A gold outline on the
          // page was the odd one out, and coloured text alone before that read
          // as a label the same weight as the section title beside it.
          <Touchable
            className="border border-border bg-card px-2.5 py-1.5 shadow-sm"
            onPress={rightAction.onPress}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={rightAction.text}
          >
            <ThemedText type="labelSm" color={primaryColor}>
              {rightAction.text}
            </ThemedText>
          </Touchable>
        )}
      </View>
    </View>
  );
}
