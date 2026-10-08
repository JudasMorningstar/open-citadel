import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { useSheetResting } from '@/components/ui/sheet';
import { DeviceLanguageRow } from '@/features/tts/components/device-language-row';
import { DeviceVoiceItem } from '@/features/tts/components/device-voice-item';
import { useStagedVoiceRows } from '@/features/tts/hooks/use-staged-voice-rows';
import { asColor } from '@/utils/colors';
import type { DeviceVoice, DeviceVoiceRow } from '@/utils/device-voices';

export interface DeviceVoiceRowsProps {
  rows: DeviceVoiceRow[];
  /** The saved voice's identifier, '' for the system default. */
  selected: string;
  previewing: string | null;
  /** The voice whose sample is being made and cannot be heard yet. */
  preparing?: string | null;
  /** The list has been scrolled, so the rows past the first few are worth drawing. */
  scrolled?: boolean;
  onSelect: (voice: DeviceVoice) => void;
  onPreview: (voice: DeviceVoice) => void;
  onToggleLanguage: (language: string) => void;
}

/**
 * The phone voice list's rows: the default, then each language with its
 * voices under it while it is open. Only open languages have their voices
 * drawn, and those a few at a time (`useStagedVoiceRows`).
 */
export function DeviceVoiceRows({
  rows,
  selected,
  previewing,
  preparing = null,
  scrolled = true,
  onSelect,
  onPreview,
  onToggleLanguage,
}: DeviceVoiceRowsProps) {
  // The first screenful rises with the sheet; the rest wait for it to land,
  // and wait again whenever it is dragged. Rows committed under a finger that
  // is dragging the sheet make it stutter and jump back.
  const { drawn, stage } = useStagedVoiceRows(rows, !useSheetResting(), scrolled);
  // Stable, so a step or a toggle redraws the one language row that changed.
  const toggleLanguage = React.useCallback(
    (language: string, wasOpen: boolean) => {
      if (!wasOpen) stage(language);
      onToggleLanguage(language);
    },
    [stage, onToggleLanguage],
  );
  const [primaryVar, mutedVar] = useCSSVariable(['--color-primary', '--color-muted-foreground']);
  const primary = asColor(primaryVar);
  const mutedForeground = asColor(mutedVar);

  const renderRow = (row: DeviceVoiceRow) => {
    switch (row.kind) {
      case 'header':
        return (
          <View key={row.key} className="bg-popover px-6 py-2">
            <ThemedText type="labelSm" color={mutedForeground}>
              {row.title}
            </ThemedText>
          </View>
        );
      case 'language':
        return (
          <DeviceLanguageRow
            key={row.key}
            language={row.language}
            count={row.count}
            open={row.open}
            mutedForeground={mutedForeground}
            onToggle={toggleLanguage}
          />
        );
      case 'voice':
        return (
          <DeviceVoiceItem
            key={row.key}
            voice={row.voice}
            isSelected={row.voice.identifier === selected}
            isPreviewing={previewing === row.voice.identifier}
            isPreparing={preparing === row.voice.identifier}
            primary={primary}
            mutedForeground={mutedForeground}
            onSelect={onSelect}
            onPreview={onPreview}
          />
        );
    }
  };

  return <>{drawn.map(renderRow)}</>;
}
