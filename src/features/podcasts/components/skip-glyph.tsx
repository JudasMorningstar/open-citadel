import React from 'react';
import { View } from 'react-native';

import { RotateCcw, RotateCw } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { fontFamily } from '@/constants/theme';

type SkipGlyphProps = {
  direction: 'back' | 'forward';
  seconds: number;
  size: number;
  color: string | undefined;
};

/**
 * Back 10 / forward 30: a turning arrow with the seconds set inside it.
 *
 * The number matters. Skip lengths differ between apps and are a setting
 * here, so an unlabelled arrow would make the listener remember how far it
 * goes; the glyph tells them every time.
 */
export function SkipGlyph({ direction, seconds, size, color }: SkipGlyphProps) {
  const Icon = direction === 'back' ? RotateCcw : RotateCw;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Icon size={size} color={color} strokeWidth={1.75} />
      <View className="absolute inset-0 items-center justify-center" style={{ paddingTop: size * 0.08 }}>
        <ThemedText
          color={color}
          style={{ fontFamily: fontFamily.sansBold, fontSize: Math.round(size * 0.3), lineHeight: Math.round(size * 0.36) }}
        >
          {seconds}
        </ThemedText>
      </View>
    </View>
  );
}
