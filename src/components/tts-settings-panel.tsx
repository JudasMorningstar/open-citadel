import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Download } from '@/components/icons';
import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { DEFAULT_VOICE, KOKORO_EN_US_VOICES, VOICE_LABELS } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';
import { cn } from '@/lib/cn';

const TTS_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * The reading voice's settings: download the voice pack if it isn't on the
 * device yet, then reading speed and voice, both as inline chips.
 *
 * Self-contained and prop-free on purpose — it reads and writes
 * `useSettingsStore`/`useTtsStore` directly, so the Settings screen and the
 * reader's own long-press quick-settings sheet can both mount it verbatim
 * and always show the same state.
 */
export function TtsSettingsPanel() {
  const [mutedForeground, primaryForeground, destructive] = useCSSVariable([
    '--color-muted-foreground',
    '--color-primary-foreground',
    '--color-destructive',
  ]);

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const ttsRate = useSettingsStore((s) => s.ttsRate);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const setTtsRate = useSettingsStore((s) => s.setTtsRate);

  const isDownloaded = useTtsStore((s) => s.isDownloaded);
  const downloadProgress = useTtsStore((s) => s.downloadProgress);
  const loadError = useTtsStore((s) => s.loadError);
  const downloadModel = useTtsStore((s) => s.downloadModel);
  const cancelDownload = useTtsStore((s) => s.cancelDownload);

  React.useEffect(() => {
    void useTtsStore.getState().loadState();
  }, []);

  const currentVoice = ttsVoice ?? DEFAULT_VOICE;

  return (
    <View className="gap-4">
      {!isDownloaded && (
        <Card className="gap-3 p-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <ThemedText type="bodyMd">Reading voice</ThemedText>
              <ThemedText type="bodySm" color={asColor(mutedForeground)}>
                Download the on-device voice to read books aloud.
              </ThemedText>
              {loadError && (
                <ThemedText type="labelSm" color={asColor(destructive)}>
                  {loadError}
                </ThemedText>
              )}
            </View>
            {downloadProgress === null && (
              <ActionButton
                icon={Download}
                label="DOWNLOAD"
                tint={asColor(mutedForeground)}
                onPress={() => void downloadModel()}
              />
            )}
          </View>
          {downloadProgress !== null && (
            <View className="gap-1">
              <View className="h-1 overflow-hidden bg-surface-tertiary">
                <View
                  className="h-1 bg-primary"
                  style={{ width: `${Math.round(downloadProgress * 100)}%` }}
                />
              </View>
              <View className="flex-row items-center justify-between">
                <ThemedText
                  type="labelSm"
                  color={asColor(mutedForeground)}
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {Math.round(downloadProgress * 100)}%
                </ThemedText>
                <Touchable onPress={cancelDownload}>
                  <ThemedText type="labelSm" color={asColor(destructive)}>
                    CANCEL
                  </ThemedText>
                </Touchable>
              </View>
            </View>
          )}
        </Card>
      )}

      <View className={cn('gap-2', !isDownloaded && 'opacity-50')}>
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>VOICE</ThemedText>
        <View className="flex-row flex-wrap gap-2">
          {KOKORO_EN_US_VOICES.map((voice) => {
            const active = currentVoice === voice;
            return (
              <Touchable key={voice} onPress={() => setTtsVoice(voice)} disabled={!isDownloaded}>
                <Card className={cn('px-4 py-2', active && 'border-primary bg-primary')}>
                  <ThemedText type="labelSm" color={active ? asColor(primaryForeground) : undefined}>
                    {VOICE_LABELS[voice]}
                  </ThemedText>
                </Card>
              </Touchable>
            );
          })}
        </View>
      </View>

      <View className="gap-3">
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>READING SPEED</ThemedText>

        {/* `flex-1` on every chip, not `flex-wrap`: they have to read as one
            row in the narrow reader sheet as much as the full Settings
            screen width. */}
        <View className="flex-row gap-1.5">
          {TTS_RATES.map((r) => {
            const active = Math.abs(ttsRate - r) < 0.01;
            return (
              <Touchable key={r} className="flex-1" onPress={() => setTtsRate(r)}>
                <Card className={cn('items-center px-1 py-2', active && 'border-primary bg-primary')}>
                  <ThemedText type="labelSm" color={active ? asColor(primaryForeground) : undefined}>
                    {r === 1 ? '1×' : `${r}×`}
                  </ThemedText>
                </Card>
              </Touchable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
