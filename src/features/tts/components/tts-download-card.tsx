import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Download } from '@/components/icons';
import { ActionButton } from '@/components/action-button';
import { DownloadMeter } from '@/components/download-meter';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { asColor } from '@/utils/colors';

export interface TtsDownloadCardProps {
  /** What the download weighs, as it reads: "350 MB". */
  size: string;
  /** 0-1 while downloading, null when idle. */
  progress: number | null;
  onDownload: () => void;
  onCancel: () => void;
}

/** An AI voice engine's download prompt, and its progress once started. */
export function TtsDownloadCard({ size, progress, onDownload, onCancel }: TtsDownloadCardProps) {
  const mutedForeground = useCSSVariable('--color-muted-foreground');

  return (
    <Card className="gap-2 p-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 gap-1">
          <ThemedText type="bodyMd">Download the voices</ThemedText>
          <ThemedText type="bodySm" color={asColor(mutedForeground)}>
            {`About ${size}, once. Works offline after.`}
          </ThemedText>
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
