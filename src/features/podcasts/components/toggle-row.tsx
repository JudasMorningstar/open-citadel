import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/cn';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ToggleRowProps = {
  title: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
};

/** A setting that is on or off: what it is, what it means, and the switch. */
export function ToggleRow({ title, hint, value, onChange, className }: ToggleRowProps) {
  const tokens = useThemeTokens();
  return (
    <View className={cn('flex-row items-center gap-4', className)}>
      <View className="flex-1 gap-0.5">
        <ThemedText type="bodyMd">{title}</ThemedText>
        <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
          {hint}
        </ThemedText>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
