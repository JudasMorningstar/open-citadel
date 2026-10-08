import React from 'react';
import Animated from 'react-native-reanimated';

import { Import, MicSignal, Telescope } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { revealIn } from '@/constants/theme';
import { OnboardingStage } from '@/components/stage/onboarding-stage';
import { StageGlyph } from '@/components/stage/stage-glyph';
import { StageHeading } from '@/components/stage/stage-heading';
import { WelcomeChoice } from '@/components/stage/welcome-choice';
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
      <StageHeading title="Your podcasts" subtitle="Find new shows, or bring yours from AntennaPod." />
      <Animated.View entering={revealIn(2)} className="gap-4 self-stretch">
        <WelcomeChoice icon={Telescope} title="Explore podcasts" detail="Shows worth your time, by topic and by chart." onPress={onStartFresh} />
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
