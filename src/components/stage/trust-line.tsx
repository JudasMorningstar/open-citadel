import React from 'react';
import Animated, { type AnimatedProps } from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

import { Lock } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type TrustLineProps = {
  /** What happens to the reader's things, in one plain sentence. */
  text: string;
  /** Its place in the stage's reveal. */
  entering?: AnimatedProps<ViewProps>['entering'];
};

/**
 * The padlock and the line it opens, saying where someone's data goes, at the
 * foot of a getting-started stage.
 *
 * Centred, with the padlock set inside the text as its first word, so it
 * stays beside the line however it wraps. As a separate element in a row, it
 * was left at the row's edge whenever the centred text wrapped away from it.
 */
export function TrustLine({ text, entering }: TrustLineProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <Animated.View entering={entering}>
      <ThemedText type="bodySm" color={muted} className="text-center">
        <Lock size={14} color={muted} />
        {`  ${text}`}
      </ThemedText>
    </Animated.View>
  );
}
