import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Import } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Progress } from '@/components/ui/progress';
import { motion, revealIn } from '@/constants/theme';
import { OnboardingStage } from '@/features/podcasts/components/onboarding/onboarding-stage';
import { StageGlyph } from '@/features/podcasts/components/onboarding/stage-glyph';
import { StageHeading } from '@/features/podcasts/components/onboarding/stage-heading';
import { importProgressLabel } from '@/features/podcasts/utils/import-summary';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ImportProgress } from '@/services/podcasts/antennapod/types';

type ImportRunningProps = {
  progress: ImportProgress;
  bottomPadding: number;
};

/**
 * An import under way: how far through the shows it is, and the name of the
 * one coming across now, changing in place as each lands. The bar is the one
 * gold thing on the screen, because it is the thing being waited on.
 */
export function ImportRunning({ progress, bottomPadding }: ImportRunningProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const { done, total, current } = progress;
  const fraction = total > 0 ? done / total : 0;
  const footer = (
    <ThemedText type="bodySm" color={muted} className="text-center">
      Keep Open Citadel open until this finishes.
    </ThemedText>
  );

  return (
    <OnboardingStage bottomPadding={bottomPadding} footer={footer}>
      <StageGlyph icon={Import} color={muted} />
      <StageHeading title="Bringing your library across" />
      <Animated.View entering={revealIn(2)} className="gap-4 self-stretch">
        <Progress value={fraction} minValue={0} maxValue={1} size="sm" />
        <ThemedText type="labelSm" color={muted} className="text-center">
          {importProgressLabel(done, total)}
        </ThemedText>
        {/* Keyed on the show, so each name fades in as it arrives rather than
            the line flickering from one to the next. */}
        <View className="h-6 items-center">
          {current ? (
            <Animated.View key={current} entering={FadeIn.duration(motion.fast)}>
              <ThemedText type="bodyMd" numberOfLines={1}>
                {current}
              </ThemedText>
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </OnboardingStage>
  );
}
