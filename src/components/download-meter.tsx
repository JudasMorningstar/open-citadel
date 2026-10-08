import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { useProgressGlide } from '@/hooks/use-progress-glide';
import { asColor } from '@/utils/colors';
import { downloadLabel } from '@/utils/progress-glide';

const FILL_ORIGIN = { transformOrigin: 'left' } as const;
const FIGURES = { fontVariant: ['tabular-nums' as const] };

/**
 * A download under way: the bar, how far along it is, and the way to stop it.
 *
 * One copy for every on-device download (Samwell's brains, the AI voices).
 * Each used to draw its own bar as a width set from React, so the fill stood
 * still between reports and then jumped. This one glides between them on the
 * UI thread: see `useProgressGlide`.
 *
 * Square, like every other meter in the app, which is also what lets the fill
 * be a scale rather than a width: there are no corners to smear.
 */
export const DownloadMeter = React.memo(function DownloadMeter({
  progress,
  onCancel,
}: {
  /** How much has arrived, 0 to 1. */
  progress: number;
  onCancel: () => void;
}) {
  const [mutedForeground, destructive] = useCSSVariable([
    '--color-muted-foreground',
    '--color-destructive',
  ]);
  const fill = useProgressGlide(progress);
  const label = downloadLabel(progress);

  return (
    <View className="gap-1">
      <View
        className="h-1 overflow-hidden bg-surface-tertiary"
        accessibilityRole="progressbar"
        accessibilityValue={{ text: label }}
      >
        <Animated.View className="h-1 w-full bg-primary" style={[FILL_ORIGIN, fill]} />
      </View>
      <View className="flex-row items-center justify-between">
        <ThemedText type="labelSm" color={asColor(mutedForeground)} style={FIGURES}>
          {label}
        </ThemedText>
        <Touchable
          onPress={onCancel}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Cancel the download"
        >
          <ThemedText type="labelSm" color={asColor(destructive)}>
            CANCEL
          </ThemedText>
        </Touchable>
      </View>
    </View>
  );
});
