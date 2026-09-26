import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Download } from '@/components/icons';
import { ActionButton } from '@/components/action-button';
import { ReadingSpeedStepper } from '@/components/reading-speed-stepper';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { VoiceCarousel } from '@/components/voice-carousel';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';

/**
 * The reading voice's settings: download the voice pack if it isn't on the
 * device yet, then voice (with a one-line preview) and reading speed.
 *
 * Self-contained and prop-free on purpose — it and the components it hosts
 * read and write `useSettingsStore`/`useTtsStore` directly, so the Settings
 * screen and the reader's own long-press quick-settings sheet can both mount
 * it verbatim and always show the same state.
 */
export function TtsSettingsPanel() {
  const [mutedForeground, destructive] = useCSSVariable([
    '--color-muted-foreground',
    '--color-destructive',
  ]);

  const isDownloaded = useTtsStore((s) => s.isDownloaded);
  const downloadProgress = useTtsStore((s) => s.downloadProgress);
  const loadError = useTtsStore((s) => s.loadError);
  const downloadModel = useTtsStore((s) => s.downloadModel);
  const cancelDownload = useTtsStore((s) => s.cancelDownload);

  React.useEffect(() => {
    void useTtsStore.getState().loadState();
  }, []);

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

      <VoiceCarousel />
      <ReadingSpeedStepper />
    </View>
  );
}
