import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Play, Volume2 } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { useVoicePreview } from '@/components/use-voice-preview';
import { KOKORO_EN_US_VOICES, resolveVoice, VOICE_DESCRIPTIONS, VOICE_LABELS } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';
import { cn } from '@/lib/cn';

/**
 * The Kokoro voice grid: a name, a one-phrase sense of its character, and a
 * tap to both select and hear it. Three tiles per row, two rows, since six is
 * the whole EN_US roster (see `KOKORO_EN_US_VOICES`).
 *
 * Self-contained and prop-free, like `TtsSettingsPanel` that hosts it — reads
 * and writes `useSettingsStore`/`useTtsStore` directly.
 */
export function VoicePicker() {
  const [mutedForeground, primaryForeground] = useCSSVariable([
    '--color-muted-foreground',
    '--color-primary-foreground',
  ]);

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const isDownloaded = useTtsStore((s) => s.isDownloaded);
  const { previewingVoice, preview, stop: stopPreview } = useVoicePreview();

  const currentVoice = resolveVoice(ttsVoice);

  return (
    <View className={cn('gap-2', !isDownloaded && 'opacity-50')}>
      <ThemedText type="labelSm" color={asColor(mutedForeground)}>VOICE</ThemedText>
      <View className="gap-2" accessibilityRole="radiogroup">
        {[0, 1].map((row) => (
          <View key={row} className="flex-row gap-2">
            {KOKORO_EN_US_VOICES.slice(row * 3, row * 3 + 3).map((voice) => {
              const active = currentVoice === voice;
              const previewing = previewingVoice === voice;
              const iconColor = active ? asColor(primaryForeground) : asColor(mutedForeground);
              return (
                <Touchable
                  key={voice}
                  className="flex-1"
                  disabled={!isDownloaded}
                  haptic="select"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active, disabled: !isDownloaded }}
                  accessibilityLabel={`${VOICE_LABELS[voice]}, ${VOICE_DESCRIPTIONS[voice]}`}
                  onPress={() => {
                    setTtsVoice(voice);
                    if (previewing) {
                      stopPreview();
                    } else {
                      void preview(voice);
                    }
                  }}
                >
                  <Card
                    className={cn(
                      'min-h-[80px] flex-row items-center justify-between gap-1 p-3',
                      active && 'border-primary bg-primary',
                    )}
                  >
                    <View className="shrink gap-0.5">
                      <ThemedText
                        type="labelSm"
                        className="uppercase"
                        color={active ? asColor(primaryForeground) : undefined}
                      >
                        {VOICE_LABELS[voice]}
                      </ThemedText>
                      <ThemedText
                        type="mono"
                        color={active ? asColor(primaryForeground) : asColor(mutedForeground)}
                      >
                        {VOICE_DESCRIPTIONS[voice]}
                      </ThemedText>
                    </View>
                    {previewing ? (
                      <Volume2 size={14} color={iconColor} />
                    ) : (
                      <Play size={14} color={iconColor} />
                    )}
                  </Card>
                </Touchable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
