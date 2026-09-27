import React from 'react';
import Animated from 'react-native-reanimated';

import { Compass, Import, MicSignal } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { revealIn } from '@/constants/theme';
import { OnboardingStage } from '@/features/podcasts/components/onboarding/onboarding-stage';
import { StageGlyph } from '@/features/podcasts/components/onboarding/stage-glyph';
import { StageHeading } from '@/features/podcasts/components/onboarding/stage-heading';
import { WelcomeChoice } from '@/features/podcasts/components/onboarding/welcome-choice';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PodcastsWelcomeProps = {
  bottomPadding: number;
  onStartFresh: () => void;
  /** Opens the guide to bringing a library across, not the file picker itself. */
  onImport: () => void;
};

/**
 * The first time Podcasts is opened: two ways in, each a card saying what it
 * brings. How to find the AntennaPod export is one tap further, in the
 * import's own guide, rather than a paragraph under both doors.
 */
export function PodcastsWelcome({ bottomPadding, onStartFresh, onImport }: PodcastsWelcomeProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const footer = (
    <Animated.View entering={revealIn(3)}>
      <ThemedText type="bodySm" color={muted} className="text-center">
        You can also import later, from the foot of Explore.
      </ThemedText>
    </Animated.View>
  );

  return (
    <OnboardingStage bottomPadding={bottomPadding} footer={footer}>
      <StageGlyph icon={MicSignal} color={tokens['--color-primary']} />
      <StageHeading title="Your podcasts" subtitle="Start new, or bring your library from AntennaPod." />
      <Animated.View entering={revealIn(2)} className="gap-4 self-stretch">
        <WelcomeChoice icon={Compass} title="Start fresh" detail="Find shows worth your time in Explore." onPress={onStartFresh} />
        <WelcomeChoice
          icon={Import}
          title="Import from AntennaPod"
          detail="Your shows, where you are in each, favorites and Up Next."
          onPress={onImport}
        />
      </Animated.View>
    </OnboardingStage>
  );
}
