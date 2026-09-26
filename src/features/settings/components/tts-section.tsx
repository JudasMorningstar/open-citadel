import { TtsSettingsPanel } from '@/components/tts-settings-panel';
import { SettingsSection } from '@/features/settings/components/settings-section';

/** Text-to-speech: the voice pack's download state, reading speed, and voice. */
export function TtsSection() {
  return (
    <SettingsSection label="TEXT TO SPEECH">
      <TtsSettingsPanel />
    </SettingsSection>
  );
}
