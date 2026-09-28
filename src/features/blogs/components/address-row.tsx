import React from 'react';
import { View } from 'react-native';

import { ChevronRight, Globe } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type AddressRowProps = {
  address: string;
  onPress: () => void;
};

/** What was typed, as an address: opens that blog's page, to read before following. */
export function AddressRow({ address, onPress }: AddressRowProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <Touchable
      className="flex-row items-center gap-4 px-6 py-3"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${address}`}
    >
      <View className="h-12 w-12 items-center justify-center border border-border bg-muted">
        <Globe size={20} color={tokens['--color-primary']} />
      </View>
      <View className="flex-1 gap-0.5">
        <ThemedText type="labelSm" color={muted}>
          OPEN THIS ADDRESS
        </ThemedText>
        <ThemedText type="headlineSm" numberOfLines={1}>
          {address}
        </ThemedText>
      </View>
      <ChevronRight size={18} color={muted} />
    </Touchable>
  );
}
