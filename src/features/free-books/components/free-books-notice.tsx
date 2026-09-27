import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

/*
 * Written to what Project Gutenberg's license and terms ask of anyone who
 * passes its books on: say where the books come from, say that they are free
 * in the United States and that readers elsewhere must check their own
 * country's laws (license 1.E.1, terms of use), and never suggest that
 * Gutenberg stands behind this app, since its name is a registered trademark.
 */
const SOURCE = 'These books come from Project Gutenberg, which has offered free ebooks since 1971.';
const COUNTRY =
  'They are in the public domain in the United States. If you live somewhere else, check the copyright laws of your country before you download one.';
const TRADEMARK = 'Open Citadel is not part of Project Gutenberg, and Project Gutenberg does not endorse it.';

/** Where the free books come from and what that means for the reader, in plain words. */
export function FreeBooksNotice({ className }: { className?: string }) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <View className={className ?? 'gap-2 px-6 pb-4'}>
      <ThemedText type="bodySm" color={muted}>
        {SOURCE}
      </ThemedText>
      <ThemedText type="bodySm" color={muted}>
        {COUNTRY}
      </ThemedText>
      <ThemedText type="bodySm" color={muted}>
        {TRADEMARK}
      </ThemedText>
    </View>
  );
}
