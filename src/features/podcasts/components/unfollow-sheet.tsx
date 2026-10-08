import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { useCSSVariable } from 'uniwind';

import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { asColor } from '@/utils/colors';

type UnfollowSheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Leaving a show takes its episodes, downloads and progress with it, which
 * is the one thing here that cannot be undone, so it asks first and says
 * exactly what goes.
 */
export function UnfollowSheet({ visible, title, onClose, onConfirm }: UnfollowSheetProps) {
  const tokens = useThemeTokens();
  const destructive = asColor(useCSSVariable('--color-destructive'));
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-4 px-4 pb-2">
        <ThemedText type="headlineSm">Unfollow {title}?</ThemedText>
        <ThemedText type="bodyMd" color={tokens['--color-muted-foreground']}>
          Its episodes, downloads and where you were in each will be removed from this device. The
          time you spent listening stays in your history.
        </ThemedText>
        <View className="flex-row gap-3">
          <ActionButton label="KEEP FOLLOWING" onPress={onClose} centered className="h-10 flex-1" />
          <ActionButton
            label="UNFOLLOW"
            onPress={onConfirm}
            tint={destructive}
            centered
            className="h-10 flex-1"
          />
        </View>
      </View>
    </Sheet>
  );
}
