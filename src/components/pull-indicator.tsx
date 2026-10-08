import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Loader } from '@/components/ui/loader';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PullIndicatorProps = {
  /** The caption under the loader: what the work is, or what the pull will do. */
  caption: string;
  /** What the loader says to a screen reader. */
  accessibilityLabel: string;
  className?: string;
};

/**
 * What sits in the gap a pull opens: the loader, and a caption under it.
 *
 * Stacked, not side by side: side by side the two read as one line of chrome,
 * a spinner acting as a bullet point for a label. Stacked, the loader is the
 * thing and the caption is a caption on it. `bar-cascade` because it is the
 * house loader: five bars, squared off, in an app with no round corners. Gold,
 * because this is the app doing work on your shelf.
 */
export function PullIndicator({ caption, accessibilityLabel, className }: PullIndicatorProps) {
  const tokens = useThemeTokens();
  return (
    <View className={className}>
      <View className="items-center gap-2">
        <Loader variant="bar-cascade" size="sm" color="--color-primary" label={accessibilityLabel} />
        <ThemedText type="labelSm" color={tokens['--color-muted-foreground']}>
          {caption}
        </ThemedText>
      </View>
    </View>
  );
}
