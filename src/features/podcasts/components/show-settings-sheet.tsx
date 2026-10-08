import React from 'react';

import { PageFade } from '@/components/scroll-fades';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { ChoiceChips } from '@/components/choice-chips';
import { ToggleRow } from '@/features/podcasts/components/toggle-row';
import { SHOW_NEW_EPISODES, SHOW_SKIPS, SHOW_SPEEDS, SHOW_SWITCHES } from '@/features/podcasts/utils/setting-choices';
import type { Podcast } from '@/services/podcasts/records';
import type { ShowSettings } from '@/services/podcasts/shows';

type ShowSettingsSheetProps = {
  visible: boolean;
  show: Podcast | null;
  onClose: () => void;
  onChange: (patch: Partial<ShowSettings>) => void;
};

/**
 * One show's own settings: AntennaPod's feed settings, the ones people
 * actually change. "Default" follows the app-wide setting, so a show only
 * differs where the listener made it differ.
 */
export function ShowSettingsSheet({ visible, show, onClose, onChange }: ShowSettingsSheetProps) {
  if (!show) return <Sheet visible={visible} onClose={onClose}>{null}</Sheet>;
  /** A setter for one setting, for a control's `onChange`. */
  const bind =
    <K extends keyof ShowSettings>(key: K) =>
    (value: ShowSettings[K]) =>
      onChange({ [key]: value } as Partial<ShowSettings>);
  const setKeepUpdated = (on: boolean) => onChange({ keepUpdated: on ? 1 : 0 });

  return (
    <Sheet visible={visible} onClose={onClose} scrollable maxHeightRatio={0.85}>
      <PageFade edges="both" surface="popover">
        <Sheet.ScrollView contentContainerClassName="gap-6 pb-4">
          <ThemedText type="headlineSm" className="px-4">
            Show settings
          </ThemedText>
          <ChoiceChips label="Playback speed" choices={SHOW_SPEEDS} value={show.playbackSpeed} onChange={bind('playbackSpeed')} />
          <ChoiceChips
            label="Skip the intro"
            hint="Starts every episode this far in."
            choices={SHOW_SKIPS}
            value={show.skipIntroSec}
            onChange={bind('skipIntroSec')}
          />
          <ChoiceChips
            label="Skip the ending"
            hint="Moves on this long before an episode ends."
            choices={SHOW_SKIPS}
            value={show.skipEndingSec}
            onChange={bind('skipEndingSec')}
          />
          <ChoiceChips
            label="New episodes go to"
            choices={SHOW_NEW_EPISODES}
            value={show.newEpisodesAction}
            onChange={bind('newEpisodesAction')}
          />
          <ChoiceChips label="Download new episodes" choices={SHOW_SWITCHES} value={show.autoDownload} onChange={bind('autoDownload')} />
          <ChoiceChips
            label="Delete downloads once played"
            choices={SHOW_SWITCHES}
            value={show.autoDelete}
            onChange={bind('autoDelete')}
          />
          <ToggleRow
            title="Check for new episodes"
            hint="Off keeps the show as it is now."
            value={show.keepUpdated === 1}
            onChange={setKeepUpdated}
            className="px-4"
          />
        </Sheet.ScrollView>
      </PageFade>
    </Sheet>
  );
}
