import React from 'react';

import { ThemeScope } from '@/components/theme-scope';
import { CreatorNoteSheet } from '@/components/settings/creator-note-sheet';
import { SettingsPage } from '@/features/settings/components/settings-page';
import { SettingsPanes } from '@/features/settings/components/settings-panes';
import { useSettingsScreen } from '@/features/settings/hooks/use-settings-screen';

/**
 * Settings: a short list of what there is to set, each row saying what it is
 * set to, and the controls a press deeper, a pane each.
 *
 * It used to be every control on one long page, which was a lot to be shown at
 * once and a lot to mount: the page had to be drawn in two waves behind a
 * placeholder so the drawer could rise at all. The list is plain rows over
 * values already in memory, so it is drawn whole in its first frame, and the
 * panes are built behind it afterwards (`useSettingsPanes`).
 */
export default function SettingsScreen() {
  const screen = useSettingsScreen();

  return (
    // The light switch is on this screen, so this screen takes a new theme at
    // once and the rest of the app follows (`ThemeScope`).
    <ThemeScope urgent>
      <SettingsPage {...screen.page}>
        <SettingsPanes {...screen.panes} />
        <CreatorNoteSheet {...screen.note} />
      </SettingsPage>
    </ThemeScope>
  );
}
