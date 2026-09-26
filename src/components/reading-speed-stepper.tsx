import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { useSettingsStore } from '@/stores/settings';
import { asColor } from '@/utils/colors';
import { cn } from '@/lib/cn';

const TTS_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatRate(rate: number): string {
  return rate === 1 ? '1×' : `${rate}×`;
}

/**
 * Reading speed as a stepped slider, not a continuous one: the rate only ever
 * lands on one of `TTS_RATES`, so dragging between stops would just snap
 * back — tapping the stop you want is the whole interaction.
 *
 * Self-contained and prop-free, like `TtsSettingsPanel` that hosts it — reads
 * and writes `useSettingsStore` directly.
 */
export function ReadingSpeedStepper() {
  const [mutedForeground, primary] = useCSSVariable(['--color-muted-foreground', '--color-primary']);

  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const setTtsRate = useSettingsStore((s) => s.setTtsRate);
  const rateIndex = TTS_RATES.findIndex((r) => Math.abs(ttsRate - r) < 0.01);

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>READING SPEED</ThemedText>
        <ThemedText type="headlineSm">{formatRate(ttsRate)}</ThemedText>
      </View>

      <View className="flex-row items-center">
        {TTS_RATES.map((r, i) => (
          <React.Fragment key={r}>
            {i > 0 && <View className={cn('h-px flex-1', i <= rateIndex ? 'bg-primary' : 'bg-border')} />}
            <Touchable onPress={() => setTtsRate(r)} hitSlop={8}>
              <View
                className={cn(
                  'rounded-[2px]',
                  i === rateIndex
                    ? 'h-4 w-4 bg-primary'
                    : i < rateIndex
                      ? 'h-2.5 w-2.5 bg-primary'
                      : 'h-2.5 w-2.5 border border-border',
                )}
              />
            </Touchable>
          </React.Fragment>
        ))}
      </View>

      <View className="flex-row justify-between">
        {TTS_RATES.map((r, i) => (
          <ThemedText
            key={r}
            type="labelSm"
            color={i === rateIndex ? asColor(primary) : asColor(mutedForeground)}
          >
            {formatRate(r)}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}
