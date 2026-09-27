import React from 'react';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { revealIn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type StageHeadingProps = {
  title: string;
  /** One line under the title. A second paragraph belongs somewhere else. */
  subtitle?: string;
  /** Its place in the step's reveal. */
  step?: number;
};

/** A step's title in the serif, and the one line that says what it is for. */
export function StageHeading({ title, subtitle, step = 1 }: StageHeadingProps) {
  const tokens = useThemeTokens();
  return (
    <Animated.View entering={revealIn(step)} className="items-center gap-2 self-stretch">
      <ThemedText type="headlineLg" className="text-center">
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="bodyMd" color={tokens['--color-muted-foreground']} className="text-center">
          {subtitle}
        </ThemedText>
      ) : null}
    </Animated.View>
  );
}
