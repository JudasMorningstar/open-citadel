import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { DeviceVoiceItem } from '@/components/device-voice-item';
import { PageFade } from '@/components/scroll-fades';
import { VoiceListSkeleton } from '@/components/skeletons/voice-list-skeleton';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { asColor } from '@/utils/colors';
import type { DeviceVoice, DeviceVoiceRow } from '@/utils/device-voices';

export interface DeviceVoiceSheetProps {
  visible: boolean;
  onClose: () => void;
  rows: DeviceVoiceRow[];
  loading: boolean;
  /** The saved voice's identifier, '' for the system default. */
  selected: string;
  previewing: string | null;
  onSelect: (voice: DeviceVoice) => void;
  onPreview: (voice: DeviceVoice) => void;
}

/** The list of the phone's voices, opened from the native voice row. */
export function DeviceVoiceSheet({
  visible,
  onClose,
  rows,
  loading,
  selected,
  previewing,
  onSelect,
  onPreview,
}: DeviceVoiceSheetProps) {
  const [primary, mutedForeground] = useCSSVariable(['--color-primary', '--color-muted-foreground']);

  const renderRow = React.useCallback(
    ({ item }: { item: DeviceVoiceRow }) => {
      if (item.kind === 'header') {
        return (
          <View className="bg-popover px-6 py-2">
            <ThemedText type="labelSm" color={asColor(mutedForeground)}>
              {item.title}
            </ThemedText>
          </View>
        );
      }
      return (
        <DeviceVoiceItem
          voice={item.voice}
          isSelected={item.voice.identifier === selected}
          isPreviewing={previewing === item.voice.identifier}
          primary={asColor(primary)}
          mutedForeground={asColor(mutedForeground)}
          onSelect={onSelect}
          onPreview={onPreview}
        />
      );
    },
    [selected, previewing, primary, mutedForeground, onSelect, onPreview],
  );

  return (
    // Two detents: it opens at half height so the settings it came from stay
    // visible, and grows to full only for hunting through a long list.
    <Sheet visible={visible} onClose={onClose} snapRatios={[0.5, 1]}>
      <View className="flex-row items-center justify-between px-6 pb-3">
        <ThemedText type="headlineSm">Select voice</ThemedText>
      </View>

      {/* Two waits, one placeholder: `Sheet.Deferred` covers the frames while
          the list mounts and the same skeleton covers the voice query, so the
          sheet goes skeleton to voices with nothing in between. */}
      <Sheet.Deferred skeleton={<VoiceListSkeleton />}>
        {loading ? (
          <VoiceListSkeleton />
        ) : (
          <PageFade edges="both" surface="popover">
            <Sheet.FlatList
              data={rows}
              keyExtractor={(item: DeviceVoiceRow) => item.key}
              // Headings and voices recycle in separate pools; without this a
              // heading cell would be re-bound to a voice and keep its styling.
              getItemType={(item: DeviceVoiceRow) => item.kind}
              extraData={`${selected}|${previewing}`}
              renderItem={renderRow}
            />
          </PageFade>
        )}
      </Sheet.Deferred>
    </Sheet>
  );
}
