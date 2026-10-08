import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Import, Link, Newspaper, Telescope } from '@/components/icons';
import { OnboardingStage } from '@/components/stage/onboarding-stage';
import { StageGlyph } from '@/components/stage/stage-glyph';
import { StageHeading } from '@/components/stage/stage-heading';
import { TrustLine } from '@/components/stage/trust-line';
import { WelcomeChoice } from '@/components/stage/welcome-choice';
import { revealIn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type BlogsWelcomeProps = {
  bottomPadding: number;
  onExplore: () => void;
  onAddByAddress: () => void;
  /** Busy while an import runs, so the door does not open twice. */
  importing: boolean;
  onImport: () => void;
};

/**
 * Blogs before anything is followed: three ways in, each a card saying what
 * it brings, and one line on where the posts come from.
 */
export function BlogsWelcome({ bottomPadding, onExplore, onAddByAddress, importing, onImport }: BlogsWelcomeProps) {
  const tokens = useThemeTokens();
  const importTitle = importing ? 'Importing…' : 'Import from another reader';
  const footer = <TrustLine text="Posts come straight from each blog to this phone." entering={revealIn(3)} />;

  return (
    <OnboardingStage bottomPadding={bottomPadding} footer={footer}>
      <StageGlyph icon={Newspaper} color={tokens['--color-primary']} />
      <StageHeading title="Your blogs" subtitle="Follow the writers you learn from, and read them as you read books." />
      <Animated.View entering={revealIn(2)} className="self-stretch">
        <View className="gap-4">
          <WelcomeChoice icon={Telescope} title="Explore blogs" detail="Essays, ideas and craft, picked for reading well." onPress={onExplore} />
          <WelcomeChoice icon={Link} title="Follow by address" detail="Any blog or site with a feed." onPress={onAddByAddress} />
          <WelcomeChoice
            icon={Import}
            title={importTitle}
            detail="An OPML file from Read You, Feedly, Inoreader and the like."
            onPress={onImport}
          />
        </View>
      </Animated.View>
    </OnboardingStage>
  );
}
