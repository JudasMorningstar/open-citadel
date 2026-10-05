import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Share } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { ChoiceChips } from '@/components/choice-chips';
import { ToggleRow } from '@/features/podcasts/components/toggle-row';
import { usePodcastSettings } from '@/features/podcasts/hooks/use-podcast-settings';
import { NEW_EPISODES, REFRESH_INTERVALS, SKIP_BACK, SKIP_FORWARD } from '@/features/podcasts/utils/setting-choices';
import { SectionLabel } from '@/features/settings/components/section-label';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PodcastSettingsSectionProps = {
  settings: ReturnType<typeof usePodcastSettings>;
};

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <SectionLabel>{label}</SectionLabel>
      <Card className="gap-6 p-4">{children}</Card>
    </View>
  );
}

/**
 * The app-wide podcast settings: AntennaPod's playback and download
 * preferences that people actually change. A show's own settings (on its
 * page) override these where it has one.
 *
 * Two groups, by when each matters: while something is playing, and when a
 * new episode comes out.
 */
export function PodcastSettingsSection({ settings }: PodcastSettingsSectionProps) {
  const tokens = useThemeTokens();
  const { prefs, bind } = settings;
  return (
    <View className="gap-8">
      <Group label="LISTENING">
        <ChoiceChips label="Skip back" choices={SKIP_BACK} value={prefs.skipBackSec} onChange={bind('skipBackSec')} surface="card" gutter="none" />
        <ChoiceChips
          label="Skip forward"
          choices={SKIP_FORWARD}
          value={prefs.skipForwardSec}
          onChange={bind('skipForwardSec')}
          surface="card"
          gutter="none"
        />
      </Group>
      <Group label="NEW EPISODES">
        <ChoiceChips
          label="New episodes go to"
          choices={NEW_EPISODES}
          value={prefs.newEpisodesAction}
          onChange={bind('newEpisodesAction')}
          surface="card"
          gutter="none"
        />
        <ChoiceChips
          label="Check for new episodes"
          choices={REFRESH_INTERVALS}
          value={prefs.refreshIntervalHours}
          onChange={bind('refreshIntervalHours')}
          surface="card"
          gutter="none"
        />
        <ToggleRow
          title="Download new episodes"
          hint="For every show that does not say otherwise."
          value={prefs.autoDownload}
          onChange={bind('autoDownload')}
        />
        <ToggleRow
          title="Delete downloads once played"
          hint="Favorites are always kept."
          value={prefs.autoDeletePlayed}
          onChange={bind('autoDeletePlayed')}
        />
      </Group>
      <ActionButton
        icon={Share}
        label="EXPORT SHOWS AS OPML"
        onPress={settings.exportShows}
        tint={tokens['--color-primary']}
        centered
        className="h-11"
      />
    </View>
  );
}

/**
 * The section, wired. A container of its own so a changed pref re-renders
 * this section and not the page around it.
 */
export const PodcastSettings = React.memo(function PodcastSettings() {
  return <PodcastSettingsSection settings={usePodcastSettings()} />;
});
