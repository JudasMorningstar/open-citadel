import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Download } from '@/components/icons';
import { ActionButton } from '@/components/action-button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { AI_VOICES_DOWNLOAD_SIZE } from '@/services/device-tts/catalogue';
import { asColor } from '@/utils/colors';

export interface TtsDownloadCardProps {
  /** 0-1 while downloading, null when idle. */
  progress: number | null;
  error: string | null;
  onDownload: () => void;
  onCancel: () => void;
}

/** The AI voice pack's download prompt, and its progress once started. */
export function TtsDownloadCard({ progress, error, onDownload, onCancel }: TtsDownloadCardProps) {
  const [mutedForeground, destructive] = useCSSVariable([
    '--color-muted-foreground',
    '--color-destructive',
  ]);

  const percent = progress === null ? 0 : Math.round(progress * 100);

  return (
    <Card className="gap-2 p-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <ThemedText type="bodyMd">Download the voices</ThemedText>
          <ThemedText type="bodySm" color={asColor(mutedForeground)}>
            {`About ${AI_VOICES_DOWNLOAD_SIZE}, once. Works offline after.`}
          </ThemedText>
          {error && (
            <ThemedText type="labelSm" color={asColor(destructive)}>
              {error}
            </ThemedText>
          )}
        </View>
        {progress === null && (
          <ActionButton
            icon={Download}
            label="DOWNLOAD"
            tint={asColor(mutedForeground)}
            onPress={onDownload}
          />
        )}
      </View>
      {progress !== null && (
        <View className="gap-1">
          <View className="h-1 overflow-hidden bg-surface-tertiary">
            <View className="h-1 bg-primary" style={{ width: `${percent}%` }} />
          </View>
          <View className="flex-row items-center justify-between">
            <ThemedText
              type="labelSm"
              color={asColor(mutedForeground)}
              style={{ fontVariant: ['tabular-nums'] }}
            >
              {percent}%
            </ThemedText>
            <Touchable onPress={onCancel}>
              <ThemedText type="labelSm" color={asColor(destructive)}>
                CANCEL
              </ThemedText>
            </Touchable>
          </View>
        </View>
      )}
    </Card>
  );
}
