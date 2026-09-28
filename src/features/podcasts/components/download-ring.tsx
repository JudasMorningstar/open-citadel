import React from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { Square } from '@/components/icons';
import { ProgressOutline } from '@/components/progress-outline';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useDownloadProgress } from '@/stores/podcast-downloads';

type DownloadRingProps = {
  episodeId: string;
  /** The outline's side. The stop mark inside scales with it. */
  size?: number;
};

/**
 * A running download: the app's square progress outline (`ProgressOutline`,
 * shared with the free books' download button) with a stop mark in the
 * middle. Drawn wherever a download shows, so the list row, the episode page
 * and the download toast all read the same.
 *
 * It subscribes to its own episode's progress only, so a download ticking
 * re-renders this and nothing around it; the outline then eases to each new
 * value on the UI thread.
 */
export function DownloadRing({ episodeId, size = 32 }: DownloadRingProps) {
  const tokens = useThemeTokens();
  const progress = useDownloadProgress(episodeId);
  const fill = useSharedValue(progress ?? 0);
  React.useEffect(() => fill.set(progress ?? 0), [fill, progress]);
  const gold = tokens['--color-primary'];
  const stop = Math.round(size * 0.3);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <ProgressOutline progress={fill} />
      <Square size={stop} color={gold} fill={gold} />
    </View>
  );
}
