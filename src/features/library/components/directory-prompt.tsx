import { LibraryBig } from '@/components/icons';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Touchable } from '@/components/ui/touchable';
import { easing, motion, popIn } from '@/constants/theme';
import { asColor } from '@/utils/colors';

type DirectoryPromptProps = {
  onPress: () => void;
  /** The other way to start: free books from Project Gutenberg. */
  onFreeBooks: () => void;
};

// iOS brings books into an app-owned folder via the picker; Android references
// EPUBs in place from a folder the user selects.
const COPY =
  process.env.EXPO_OS === 'ios'
    ? {
        description:
          'Add your EPUB books and Open Citadel organizes them for you.',
        button: 'GET STARTED',
      }
    : {
        description:
          'Select the folder on your device where your ebooks are stored. The app will sync all .epub files from that folder.',
        button: 'SELECT FOLDER',
      };

export function DirectoryPrompt({ onPress, onFreeBooks }: DirectoryPromptProps) {
  const [primary, mutedForeground] = useCSSVariable([
    '--color-primary',
    '--color-muted-foreground',
  ]);

  return (
    <View className="flex-1 items-center justify-center gap-5 px-10">
      <Animated.View
        entering={popIn(motion.base)}
        style={{ marginBottom: 16 }}
      >
        <LibraryBig size={48} color={asColor(primary)} />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(motion.base).easing(easing).delay(80)}>
        <ThemedText type="headlineLg" className="text-center">
          Build Your Library
        </ThemedText>
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(motion.base).easing(easing).delay(140)}>
        <ThemedText
          type="bodyMd"
          color={asColor(mutedForeground)}
          style={{ textAlign: 'center', lineHeight: 24 }}
        >
          {COPY.description}
        </ThemedText>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(motion.base).easing(easing).delay(200)}
        style={{ marginTop: 24, alignSelf: 'stretch' }}
      >
        <GoldButton label={COPY.button} onPress={onPress} />
        <Touchable onPress={onFreeBooks} accessibilityRole="button" className="items-center py-4">
          <ThemedText type="labelSm" color={asColor(primary)}>
            OR FIND FREE BOOKS
          </ThemedText>
        </Touchable>
      </Animated.View>
    </View>
  );
}
