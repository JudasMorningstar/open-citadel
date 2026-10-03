import React from 'react';
import { View } from 'react-native';

import { DeviceVoiceRows } from '@/features/tts/components/device-voice-rows';
import { PageFade } from '@/components/scroll-fades';
import { VoiceListSkeleton } from '@/components/skeletons/voice-list-skeleton';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
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
  onToggleLanguage: (language: string) => void;
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
  onToggleLanguage,
}: DeviceVoiceSheetProps) {
  return (
    // Fixed height, one detent, and a plain `Sheet.ScrollView` rather than
    // `Sheet.FlatList` — the same shape `PlanInfoSheet` uses, which is the
    // one other sheet in the app genuinely nested inside another open sheet
    // (via `stackBehavior="push"`, same as here). FlashList's gesture
    // registration (`Sheet.FlatList`'s `useBottomSheetScrollableCreator`) is
    // what every *other* nested-in-a-sheet picker in this codebase avoids —
    // `Select`'s own sheet presentation isn't used inside a sheet either, in
    // favour of its plain-`ScrollView` overlay presentation. Scrolling this
    // list while it sat behind a second, independently-gestured `BottomSheetModal`
    // is what made the drawer behind it jump/expand and made a plain pan hard
    // to close: two live gesture recognizers over the same list, not the
    // detents or the stack behavior.
    //
    // A plain scroll view draws every row it is given, and with every voice a
    // phone has in it that can be hundreds of rows mounted in one go. So the
    // rows it is given are few: only the useful languages arrive open
    // (`usefulLanguages`), and the rest are one row each until tapped.
    <Sheet visible={visible} onClose={onClose} stackBehavior="push" fixedHeightRatio={0.75}>
      <View className="flex-row items-center justify-between px-6 pb-3 pt-2">
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
            <Sheet.ScrollView>
              <DeviceVoiceRows
                rows={rows}
                selected={selected}
                previewing={previewing}
                onSelect={onSelect}
                onPreview={onPreview}
                onToggleLanguage={onToggleLanguage}
              />
            </Sheet.ScrollView>
          </PageFade>
        )}
      </Sheet.Deferred>
    </Sheet>
  );
}
