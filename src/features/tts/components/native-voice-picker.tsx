import { DeviceVoiceSheet } from "@/features/tts/components/device-voice-sheet";
import { VoicePickerRow } from "@/features/tts/components/voice-picker-row";
import { useDeviceVoices } from "@/features/tts/hooks/use-device-voices";
import { deviceVoiceName, type DeviceVoice } from "@/utils/device-voices";
import React from "react";

export interface NativeVoicePickerProps {
  /** The saved phone voice's identifier, '' for the system default. */
  selected: string;
  /** `identifier` and `language` are '' for the system default. */
  onSelect: (identifier: string, language: string) => void;
}

/**
 * The native voice: a row naming the current phone voice that opens the list
 * of the phone's English voices, each with a preview.
 */
export function NativeVoicePicker({
  selected,
  onSelect,
}: NativeVoicePickerProps) {
  const [open, setOpen] = React.useState(false);
  const { voices, rows, loading, previewing, preview, stop } =
    useDeviceVoices();

  const close = React.useCallback(() => {
    stop();
    setOpen(false);
  }, [stop]);

  const handleSelect = React.useCallback(
    (voice: DeviceVoice) => {
      onSelect(voice.identifier, voice.language);
      close();
    },
    [onSelect, close],
  );

  return (
    <>
      <VoicePickerRow
        name={deviceVoiceName(voices, selected)}
        onPress={() => setOpen(true)}
        accessibilityLabel="Choose a Lite voice"
      />

      <DeviceVoiceSheet
        visible={open}
        onClose={close}
        rows={rows}
        loading={loading}
        selected={selected}
        previewing={previewing}
        onSelect={handleSelect}
        onPreview={preview}
      />
    </>
  );
}
