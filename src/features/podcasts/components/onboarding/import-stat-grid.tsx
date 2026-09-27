import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { revealIn } from '@/constants/theme';
import type { ImportStat } from '@/features/podcasts/utils/import-summary';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ImportStatGridProps = {
  stats: ImportStat[];
  /** Where the first tile falls in the screen's reveal. */
  firstStep: number;
};

/**
 * What came across, as figures rather than a list of sentences: each count in
 * the serif on its own tile, two to a row, arriving one after another.
 */
export function ImportStatGrid({ stats, firstStep }: ImportStatGridProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const rows: ImportStat[][] = [];
  for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2));

  return (
    <View className="gap-4 self-stretch">
      {rows.map((row, r) => (
        <View key={row[0].key} className="flex-row gap-4">
          {row.map((stat, c) => (
            <Animated.View key={stat.key} entering={revealIn(firstStep + r * 2 + c)} className="flex-1">
              <Card>
                <View className="gap-2 p-4">
                  <ThemedText type="headlineLg">{stat.value}</ThemedText>
                  <ThemedText type="labelSm" color={muted}>
                    {stat.label}
                  </ThemedText>
                </View>
              </Card>
            </Animated.View>
          ))}
          {/* An odd tile keeps its column rather than stretching across two. */}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
    </View>
  );
}
