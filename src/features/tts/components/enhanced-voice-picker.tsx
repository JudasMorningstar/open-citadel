import React from "react";
import { View } from "react-native";

import { useOnScreen } from "@/components/kept-alive";
import { ThemedText } from "@/components/themed-text";
import { DeviceVoiceSheet } from "@/features/tts/components/device-voice-sheet";
import { VoicePickerRow } from "@/features/tts/components/voice-picker-row";
import { useVoicePreview } from "@/features/tts/hooks/use-voice-preview";
import { enhancedVoiceRows } from "@/features/tts/utils/enhanced-voices";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import {
    voiceDescriptor,
    voiceLabel,
    type AiVoice,
} from "@/services/device-tts/catalogue";
import type { DeviceVoice } from "@/utils/device-voices";

export interface EnhancedVoicePickerProps {
  /** The chosen voice box's voices. */
  voices: readonly AiVoice[];
  /** The voice in use, which is one of them. */
  selected: AiVoice;
  onPick: (voice: AiVoice) => void;
}

const NAMING = { label: voiceLabel, descriptor: voiceDescriptor };

/**
 * The Enhanced voice: a row naming the voice in use that opens the list of
 * the chosen voice box's others, each with a sample. The same row and the
 * same list as the Lite voices.
 *
 * It was a carousel of cards. One voice showed at a time, so comparing two
 * meant swiping between them, and ten cards were the dearest thing in the
 * panel to build. A list shows every name at once and costs nothing until it
 * is opened.
 */
export function EnhancedVoicePicker({
  voices,
  selected,
  onPick,
}: EnhancedVoicePickerProps) {
  const tokens = useThemeTokens();
  const [open, setOpen] = React.useState(false);
  const {
    previewingVoice,
    preparingVoice,
    previewError,
    previewNotice,
    preview,
    stop,
  } = useVoicePreview();
  const rows = React.useMemo(() => enhancedVoiceRows(voices, NAMING), [voices]);

  const close = React.useCallback(() => {
    stop();
    setOpen(false);
  }, [stop]);

  // Put away rather than removed (`KeptAlive`): its sample must not play on
  // under whatever took its place.
  const onScreen = useOnScreen();
  React.useEffect(() => {
    if (!onScreen) stop();
  }, [onScreen, stop]);

  const handleSelect = React.useCallback(
    (voice: DeviceVoice) => {
      onPick(voice.identifier as AiVoice);
      close();
    },
    [onPick, close],
  );
  // Read through a ref so the handler keeps one identity. The rows are
  // memoised on it, and a handler remade each time a sample started or ended
  // redrew every row in the list for a change that concerns one.
  const playing = React.useRef(previewingVoice);
  React.useEffect(() => {
    playing.current = previewingVoice;
  }, [previewingVoice]);
  const handlePreview = React.useCallback(
    (voice: DeviceVoice) => {
      // The speaker on the voice that is playing, or still being made, stops it.
      if (playing.current === voice.identifier) stop();
      else void preview(voice.identifier as AiVoice);
    },
    [preview, stop],
  );
  const note = previewError || previewNotice;

  return (
    <View className="gap-2">
      <VoicePickerRow
        name={voiceLabel(selected)}
        onPress={() => setOpen(true)}
        accessibilityLabel="Choose an Enhanced voice"
      />
      <DeviceVoiceSheet
        visible={open}
        onClose={close}
        rows={rows}
        loading={false}
        selected={selected}
        previewing={previewingVoice}
        preparing={preparingVoice}
        note={note}
        onSelect={handleSelect}
        onPreview={handlePreview}
      />
      {note && !open ? (
        <ThemedText type="bodySm" color={tokens["--color-muted-foreground"]}>
          {note}
        </ThemedText>
      ) : null}
    </View>
  );
}
