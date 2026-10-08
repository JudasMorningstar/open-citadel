import React from 'react';
import { View } from 'react-native';

import { DeviceVoiceRows } from '@/features/tts/components/device-voice-rows';
import { PageFade } from '@/components/scroll-fades';
import { VoiceListSkeleton } from '@/components/skeletons/voice-list-skeleton';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { DeviceVoice, DeviceVoiceRow } from '@/utils/device-voices';

export interface DeviceVoiceSheetProps {
  visible: boolean;
  onClose: () => void;
  rows: DeviceVoiceRow[];
  loading: boolean;
  /** The saved voice's identifier, '' for the system default. */
  selected: string;
  previewing: string | null;
  /** The voice whose sample is being made and cannot be heard yet. */
  preparing?: string | null;
  /** Something a sample has to say for itself: it is still loading, or it failed. */
  note?: string | null;
  onSelect: (voice: DeviceVoice) => void;
  onPreview: (voice: DeviceVoice) => void;
  onToggleLanguage: (language: string) => void;
}

/** The list of voices to choose from, opened from the voice row: the phone's own, or a voice box's. */
export function DeviceVoiceSheet({
  visible,
  onClose,
  rows,
  loading,
  selected,
  previewing,
  preparing,
  note,
  onSelect,
  onPreview,
  onToggleLanguage,
}: DeviceVoiceSheetProps) {
  const tokens = useThemeTokens();
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
      <View className="gap-1 px-6 pb-3 pt-2">
        <ThemedText type="headlineSm">Select voice</ThemedText>
        {note ? (
          <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
            {note}
          </ThemedText>
        ) : null}
      </View>

      {/* A placeholder only for a real wait: the phone has not answered yet.
          It is asked ahead (when Settings opens), so the usual case is a list
          already in hand, and that is drawn with the sheet as it rises: its
          first screenful at once, the rest in steps after the sheet lands
          (`DeviceVoiceRows`). It used to rise onto the placeholder every time
          and swap to the list after, which read as the voices loading again
          on each open. */}
      {loading ? (
        <VoiceListSkeleton />
      ) : (
        <PageFade edges="both" surface="popover">
          <Sheet.ScrollView>
            <DeviceVoiceRows
              rows={rows}
              selected={selected}
              previewing={previewing}
              preparing={preparing}
              onSelect={onSelect}
              onPreview={onPreview}
              onToggleLanguage={onToggleLanguage}
            />
          </Sheet.ScrollView>
        </PageFade>
      )}
    </Sheet>
  );
}
