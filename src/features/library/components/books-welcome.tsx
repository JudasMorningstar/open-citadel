import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { FolderPlus, Library, LibraryBig } from '@/components/icons';
import { OnboardingStage } from '@/components/stage/onboarding-stage';
import { StageGlyph } from '@/components/stage/stage-glyph';
import { StageHeading } from '@/components/stage/stage-heading';
import { TrustLine } from '@/components/stage/trust-line';
import { WelcomeChoice } from '@/components/stage/welcome-choice';
import { revealIn } from '@/constants/theme';
import { booksWelcomeCopy } from '@/features/library/utils/books-welcome';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

/** Decided once: the platform does not change while the app runs. */
const COPY = booksWelcomeCopy(process.env.EXPO_OS);

type BooksWelcomeProps = {
  bottomPadding: number;
  /** Brings the reader's own books in: the picker on iOS, the folder on Android. */
  onAddBooks: () => void;
  onFreeBooks: () => void;
};

/**
 * The Library before it has a book: two ways in, each a card saying what it
 * brings, drawn like the podcasts' and blogs' getting started so the three
 * sides of the Library start the same way.
 */
export function BooksWelcome({ bottomPadding, onAddBooks, onFreeBooks }: BooksWelcomeProps) {
  const tokens = useThemeTokens();
  const footer = <TrustLine text={COPY.trust} entering={revealIn(3)} />;

  return (
    <OnboardingStage bottomPadding={bottomPadding} footer={footer}>
      <StageGlyph icon={Library} color={tokens['--color-primary']} />
      <StageHeading title="Your books" subtitle="Bring the books you own, or start with a free classic." />
      <Animated.View entering={revealIn(2)} className="self-stretch">
        <View className="gap-4">
          <WelcomeChoice icon={FolderPlus} title={COPY.ownTitle} detail={COPY.ownDetail} onPress={onAddBooks} />
          <WelcomeChoice
            icon={LibraryBig}
            title="Find free books"
            detail="Classics from Project Gutenberg, free to keep."
            onPress={onFreeBooks}
          />
        </View>
      </Animated.View>
    </OnboardingStage>
  );
}
