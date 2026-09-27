import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { Square } from '@/components/icons';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { useDownloadProgress } from '@/stores/podcast-downloads';

const STROKE = 2;

type DownloadRingProps = {
  episodeId: string;
  /** The outline's side. The stop mark inside scales with it. */
  size?: number;
};

/**
 * A running download: a square outline filling in clockwise as it goes, with
 * a stop mark in the middle. Drawn wherever a download shows, so the list
 * row, the episode page and the download toast all read the same.
 *
 * Square because every other mark in the app is. It subscribes to its own
 * episode's progress only, so a download ticking re-renders this and nothing
 * around it.
 */
export function DownloadRing({ episodeId, size = 32 }: DownloadRingProps) {
  const tokens = useThemeTokens();
  const progress = useDownloadProgress(episodeId);
  const gold = tokens['--color-primary'];
  const side = size - STROKE;
  const perimeter = side * 4;
  const drawn = perimeter * (progress ?? 0);
  const stop = Math.round(size * 0.3);

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Rect x={STROKE / 2} y={STROKE / 2} width={side} height={side} stroke={tokens['--color-surface-tertiary']} strokeWidth={STROKE} fill="none" />
        <Rect
          x={STROKE / 2}
          y={STROKE / 2}
          width={side}
          height={side}
          stroke={gold}
          strokeWidth={STROKE}
          fill="none"
          strokeDasharray={`${drawn} ${perimeter}`}
          strokeLinecap="butt"
        />
      </Svg>
      <Square size={stop} color={gold} fill={gold} />
    </View>
  );
}
