import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { AudioLines, ChevronUp, Download } from '@/components/icons';

import {
  useVoicePicker,
  type VoiceItem,
  type VoiceListRow,
} from '@/features/settings/hooks/use-voice-picker';
import { SettingsSection } from '@/features/settings/components/settings-section';
import { ThemedText } from '@/components/themed-text';
import { VoiceListSkeleton } from '@/components/skeletons/voice-list-skeleton';
import { PageFade } from '@/components/scroll-fades';
import { ActionButton } from '@/components/action-button';
import { Card } from '@/components/ui/card';
import { PrefixIcon } from '@/components/ui/prefix-icon';
import { Sheet } from '@/components/ui/sheet';
import { Touchable } from '@/components/ui/touchable';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';
import { cn } from '@/lib/cn';

const TTS_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Text-to-speech: reading speed, the voice, and the voice pack's download
 * state. Owns the voice modal.
 */
export function TtsSection() {
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

  const picker = useVoicePicker(ttsVoice);

  return (
    <SettingsSection label="TEXT TO SPEECH">
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

      <ThemedText type="labelSm" color={asColor(mutedForeground)}>READING SPEED</ThemedText>
      <View className="flex-row flex-wrap gap-2">
        {TTS_RATES.map((r) => {
          const active = Math.abs(ttsRate - r) < 0.01;
          return (
            <Touchable key={r} onPress={() => setTtsRate(r)}>
              <Card className={cn('px-4 py-2', active && 'border-primary bg-primary')}>
                <ThemedText type="labelSm" color={active ? asColor(primaryForeground) : undefined}>
                  {r === 1 ? '1×' : `${r}×`}
                </ThemedText>
              </Card>
            </Touchable>
          );
        })}
      </View>

      <Touchable onPress={picker.open} disabled={!isDownloaded}>
        <Card className={cn('flex-row items-center justify-between p-4', !isDownloaded && 'opacity-50')}>
          <View className="flex-row items-center gap-3">
            <PrefixIcon icon={AudioLines} size={36} />
            <ThemedText type="bodyMd">Voice</ThemedText>
          </View>
          <View className="flex-row items-center gap-1">
            <ThemedText type="bodySm" color={asColor(mutedForeground)}>
              {picker.currentName}
            </ThemedText>
            <ChevronUp size={14} color={asColor(mutedForeground)} />
          </View>
        </Card>
      </Touchable>

      <VoicePickerModal
        picker={picker}
        currentVoice={ttsVoice}
        onSelect={(identifier, language) => {
          setTtsVoice(identifier, language);
          picker.close();
        }}
      />
    </SettingsSection>
  );
}

/** One voice row, memoized on primitives: a selection flip re-renders the affected rows only. */
const VoiceRow = React.memo(function VoiceRow({
  voice,
  isSelected,
  primary,
  mutedForeground,
  onSelect,
}: {
  voice: VoiceItem;
  isSelected: boolean;
  primary?: string;
  mutedForeground?: string;
  onSelect: (identifier: string | null, language: string | null) => void;
}) {
  return (
    <Touchable
      className="flex-row items-center gap-4 border-b border-card px-6 py-4"
      onPress={() => onSelect(voice.identifier, voice.language)}
    >
      <View className="flex-1 gap-1">
        <ThemedText type="bodyMd">{voice.name}</ThemedText>
        <ThemedText type="labelSm" color={mutedForeground}>
          {voice.language}
        </ThemedText>
      </View>
      {isSelected && (
        <ThemedText type="bodyMd" color={primary}>✓</ThemedText>
      )}
    </Touchable>
  );
});

function VoicePickerModal({
  picker,
  currentVoice,
  onSelect,
}: {
  picker: ReturnType<typeof useVoicePicker>;
  currentVoice: string | null;
  onSelect: (identifier: string | null, language: string | null) => void;
}) {
  const [primary, mutedForeground] = useCSSVariable([
    '--color-primary',
    '--color-muted-foreground',
  ]);

  /*
   * `onSelect` arrives as an inline arrow from the call site, so it cannot
   * key the memoized rows directly. It rides in through a ref instead —
   * taps land after commit, so the effect-synced ref never misses.
   */
  const onSelectRef = React.useRef(onSelect);
  React.useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const handleSelect = React.useCallback(
    (identifier: string | null, language: string | null) => {
      onSelectRef.current(identifier, language);
    },
    [],
  );

  const renderRow = React.useCallback(
    ({ item }: { item: VoiceListRow }) => {
      const { voice } = item;
      return (
        <VoiceRow
          voice={voice}
          isSelected={currentVoice === voice.identifier}
          primary={asColor(primary)}
          mutedForeground={asColor(mutedForeground)}
          onSelect={handleSelect}
        />
      );
    },
    [currentVoice, primary, mutedForeground, handleSelect],
  );

  return (
    <Sheet visible={picker.visible} onClose={picker.close} snapRatios={[0.5, 1]}>
      <View className="flex-row items-center justify-between px-6 pb-3">
        <ThemedText type="headlineSm">Select voice</ThemedText>
      </View>

      <Sheet.Deferred skeleton={<VoiceListSkeleton />}>
        <PageFade edges="both" surface="popover">
          <Sheet.FlatList
            data={picker.rows}
            keyExtractor={(item: VoiceListRow) => item.key}
            renderItem={renderRow}
          />
        </PageFade>
      </Sheet.Deferred>
    </Sheet>
  );
}
