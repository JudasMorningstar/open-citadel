import React from 'react';

import * as actions from '@/services/podcasts/actions';
import type { Podcast } from '@/services/podcasts/records';
import type { ShowSettings } from '@/services/podcasts/shows';

/** A show page's two sheets: its settings, and the confirmation before unfollowing. */
export function useShowSheets(show: Podcast | null, unfollow: () => Promise<void>) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [unfollowOpen, setUnfollowOpen] = React.useState(false);

  const changeSettings = React.useCallback(
    (patch: Partial<ShowSettings>) => show && void actions.updateShowSettings(show.id, patch),
    [show],
  );
  const confirmUnfollow = React.useCallback(() => {
    setUnfollowOpen(false);
    void unfollow();
  }, [unfollow]);

  return {
    openSettings: () => setSettingsOpen(true),
    openUnfollow: () => setUnfollowOpen(true),
    settings: { visible: settingsOpen, show, onClose: () => setSettingsOpen(false), onChange: changeSettings },
    unfollow: { visible: unfollowOpen, onClose: () => setUnfollowOpen(false), onConfirm: confirmUnfollow },
  };
}
