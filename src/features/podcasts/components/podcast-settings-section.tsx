import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { MicSignal, Share } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrefixIcon } from '@/components/ui/prefix-icon';
import { ChoiceChips } from '@/features/podcasts/components/choice-chips';
import { ToggleRow } from '@/features/podcasts/components/toggle-row';
import { usePodcastSettings } from '@/features/podcasts/hooks/use-podcast-settings';
import { NEW_EPISODES, REFRESH_INTERVALS, SKIP_BACK, SKIP_FORWARD } from '@/features/podcasts/utils/setting-choices';
import { SettingsSection } from '@/features/settings/components/settings-section';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type PodcastSettingsSectionProps = {
  settings: ReturnType<typeof usePodcastSettings>;
};

/**
 * The app-wide podcast settings: AntennaPod's playback and download
 * preferences that people actually change. A show's own settings (on its
 * page) override these where it has one.
 */
export function PodcastSettingsSection({ settings }: PodcastSettingsSectionProps) {
  const tokens = useThemeTokens();
  const { prefs, bind } = settings;
  return (
    <SettingsSection label="PODCASTS">
      <Card className="gap-6 p-4">
        <View className="flex-row items-center gap-3">
          <PrefixIcon icon={MicSignal} size={36} />
          <ThemedText type="bodyMd" className="flex-1">
            Listening
          </ThemedText>
        </View>
        <ChoiceChips label="Skip back" choices={SKIP_BACK} value={prefs.skipBackSec} onChange={bind('skipBackSec')} surface="card" gutter="none" />
        <ChoiceChips
          label="Skip forward"
          choices={SKIP_FORWARD}
          value={prefs.skipForwardSec}
          onChange={bind('skipForwardSec')}
          surface="card"
          gutter="none"
        />
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
        <ActionButton
          icon={Share}
          label="EXPORT SHOWS AS OPML"
          onPress={settings.exportShows}
          tint={tokens['--color-primary']}
          centered
          className="h-11"
        />
      </Card>
    </SettingsSection>
  );
}

/**
 * The section, wired. A container of its own so a changed pref re-renders
 * this section and not the whole Settings screen around it.
 */
export const PodcastSettings = React.memo(function PodcastSettings() {
  return <PodcastSettingsSection settings={usePodcastSettings()} />;
});
