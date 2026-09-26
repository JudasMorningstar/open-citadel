import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ActionButton } from '@/components/action-button';
import { Import, MicSignal } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { easing, motion, popIn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PodcastsWelcomeProps = {
  onStartFresh: () => void;
  onImport: () => void;
};

const rise = (step: number) => FadeInUp.duration(motion.base).easing(easing).delay(80 + step * 60);

/**
 * The first time Podcasts is opened: two doors, and a line on how to find the
 * second one. Composed like the books side's first screen, so the two
 * libraries greet a reader in the same voice.
 */
export function PodcastsWelcome({ onStartFresh, onImport }: PodcastsWelcomeProps) {
  const tokens = useThemeTokens();
  return (
    <View className="flex-1 items-center justify-center gap-5 px-10">
      <Animated.View entering={popIn(motion.base)} style={{ marginBottom: 16 }}>
        <MicSignal size={48} color={tokens['--color-primary']} />
      </Animated.View>

      <Animated.View entering={rise(0)}>
        <ThemedText type="headlineLg" className="text-center">
          Your Podcasts
        </ThemedText>
      </Animated.View>

      <Animated.View entering={rise(1)}>
        <ThemedText type="bodyMd" color={tokens['--color-muted-foreground']} style={{ textAlign: 'center' }}>
          Start fresh and find shows worth your time, or bring your AntennaPod library with you, with
          everything you have listened to.
        </ThemedText>
      </Animated.View>

      <Animated.View entering={rise(2)} className="mt-6 gap-3 self-stretch">
        <GoldButton label="START FRESH" onPress={onStartFresh} />
        <ActionButton icon={Import} label="IMPORT FROM ANTENNAPOD" onPress={onImport} tint={tokens['--color-primary']} centered className="h-12" />
      </Animated.View>

      <Animated.View entering={rise(3)}>
        <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} style={{ textAlign: 'center' }}>
          In AntennaPod, open Settings, then Import/Export, and choose Database export. An OPML file
          works too, for your subscriptions only.
        </ThemedText>
      </Animated.View>
    </View>
  );
}
