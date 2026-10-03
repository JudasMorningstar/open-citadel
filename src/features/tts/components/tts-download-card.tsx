import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Download } from '@/components/icons';
import { ActionButton } from '@/components/action-button';
import { DownloadMeter } from '@/components/download-meter';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
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
      {/* The same meter Samwell's brains download under: it glides between
          reports rather than jumping to each. */}
      {progress !== null && <DownloadMeter progress={progress} onCancel={onCancel} />}
    </Card>
  );
}
