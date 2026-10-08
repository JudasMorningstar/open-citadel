import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { contentColumn } from '@/constants/theme';

/** A titled part of an episode's page: Chapters, Show Notes. */
export function EpisodeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3" style={contentColumn}>
      <ThemedText type="headlineSm">{title}</ThemedText>
      {children}
    </View>
  );
}
