import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

import { useWarmPlanOffer } from '@/features/billing/hooks/use-plan-offer';
import type { SettingsPanesProps } from '@/features/settings/components/settings-panes';
import { useLightMode } from '@/features/settings/hooks/use-light-mode';
import { useSettingsPanes } from '@/features/settings/hooks/use-settings-panes';
import { useSettingsSummaries } from '@/features/settings/hooks/use-settings-summaries';
import { PANE_TITLES, isSettingsPane } from '@/features/settings/utils/panes';
import { useCloudIdentity } from '@/hooks/use-cloud-identity';
import { backTo } from '@/navigation/navigate';
import { prefetchDeviceVoices } from '@/query-manager/device-voices';
import { NATIVE_VOICE_AVAILABLE } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';

/**
 * Settings: the list's lines of state, the two things it sets itself (the
 * theme, the note), and the panes under it.
 *
 * `pane` in the route opens it straight onto a pane (the chat's "set Samwell
 * up"), and `panel=cloud` opens Samwell's on its cloud half.
 *
 * It also asks ahead for what the panes draw from, once the drawer has landed:
 * the plans on sale and the phone's own voices. Both are slow the first time,
 * so by the time a pane is opened its answer is in the cache.
 */
export function useSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ pane?: string; panel?: string }>();
  const enteredAt = isSettingsPane(params.pane) ? params.pane : null;
  const close = React.useCallback(() => backTo(router, '/'), [router]);
  const { pane, open, leave, leaves, scrollRef, warm, landed } = useSettingsPanes(enteredAt, close);

  const username = useSettingsStore((s) => s.username);
  const summaries = useSettingsSummaries();
  const theme = useLightMode();
  const [noteOpen, setNoteOpen] = React.useState(false);
  const openNote = React.useCallback(() => setNoteOpen(true), []);
  const closeNote = React.useCallback(() => setNoteOpen(false), []);

  // Not before the identity settles: that is when the purchases SDK has been started.
  const identityKnown = useCloudIdentity().kind !== 'unknown';
  useWarmPlanOffer(landed && identityKnown);
  React.useEffect(() => {
    if (landed && NATIVE_VOICE_AVAILABLE) prefetchDeviceVoices();
  }, [landed]);

  const openProfile = React.useCallback(() => open('profile'), [open]);
  const panes: SettingsPanesProps = {
    pane,
    warm,
    home: { name: username || 'Add your name', summaries, ...theme, onOpen: open, onOpenNote: openNote },
    samwell: { onRequestAccount: openProfile, initialMode: params.panel === 'cloud' ? 'cloud' : undefined },
  };

  return {
    page: { title: pane ? PANE_TITLES[pane] : 'Settings', leaves, onLeave: leave, scrollRef },
    panes,
    note: { visible: noteOpen, onClose: closeNote },
  };
}
