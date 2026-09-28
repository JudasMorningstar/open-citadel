import React from 'react';
import { ScrollView, View } from 'react-native';

import { PageFade } from '@/components/scroll-fades';
import { contentColumn } from '@/constants/theme';

/** Hoisted: a fresh object per render re-lays the scroll region out. */
const SCROLL_CONTENT = { flexGrow: 1, justifyContent: 'center' } as const;

type OnboardingStageProps = {
  children: React.ReactNode;
  /** The actions, pinned under the content where the thumb already is. */
  footer?: React.ReactNode;
  /** Room kept at the bottom for the safe area and anything floating there. */
  bottomPadding: number;
};

/**
 * The frame every step of getting started is drawn in: one centred column
 * that reads top to bottom, and the step's actions held at the bottom
 * rather than wherever the text above them happened to end.
 *
 * The column scrolls only when it has to (a small phone, large text), and
 * says so with the house fade.
 */
export function OnboardingStage({ children, footer, bottomPadding }: OnboardingStageProps) {
  return (
    <View className="flex-1" style={{ paddingBottom: bottomPadding }}>
      <PageFade edges="both">
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-8"
          contentContainerStyle={SCROLL_CONTENT}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center gap-8" style={contentColumn}>
            {children}
          </View>
        </ScrollView>
      </PageFade>
      {footer ? (
        <View className="gap-4 px-6 pt-4" style={contentColumn}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}
