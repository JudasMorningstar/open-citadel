import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

/*
 * Where the posts come from, and what is owed to the people who wrote them.
 * A reader app only ever passes on what a blog publishes in its own feed, and
 * each post keeps its link home; the writers are not ours to vouch for, nor
 * we for them.
 */
const SOURCE = "Posts come from each blog's own public feed, and every one links back to the original.";
const WRITERS = 'Open Citadel is not connected with these blogs. If one is worth your time, visit it and support the writer.';

/** Where the blogs' posts come from, in plain words, at the foot of Explore. */
export function BlogsNotice() {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <View className="gap-2 px-6 pb-4">
      <ThemedText type="bodySm" color={muted}>
        {SOURCE}
      </ThemedText>
      <ThemedText type="bodySm" color={muted}>
        {WRITERS}
      </ThemedText>
    </View>
  );
}
