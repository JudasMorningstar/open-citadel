import React from 'react';

import type { EngineMode } from '@/components/settings/engine-info-sheet';
import { KeptAlive } from '@/components/kept-alive';
import { PodcastSettings } from '@/features/podcasts/components/podcast-settings-section';
import { AccountCard } from '@/features/settings/components/account-card';
import { DisplayNameCard } from '@/features/settings/components/display-name-card';
import { SamwellSection } from '@/features/settings/components/samwell-section';
import { SettingsHome, type SettingsHomeProps } from '@/features/settings/components/settings-home';
import type { SettingsPane } from '@/features/settings/utils/panes';
import { TtsSettingsPanel } from '@/features/tts/components/tts-settings-panel';

export type SettingsPanesProps = {
  /** The pane showing, or null for the list. */
  pane: SettingsPane | null;
  /** The panes to build before they are opened. */
  warm: Record<SettingsPane, boolean>;
  home: SettingsHomeProps;
  samwell: { onRequestAccount: () => void; initialMode?: EngineMode };
};

/*
 * The panes that take nothing from the screen, made once. The screen draws
 * again on every press (the pane showing changed), and an element that is the
 * same object as last time is one React does not draw again: so a press
 * redraws the list and Samwell's props, and none of these.
 */
const PROFILE = (
  <>
    {/* The display name first because everyone has one and it needs
        nothing; the account under it because it is optional. */}
    <DisplayNameCard />
    <AccountCard />
  </>
);
const VOICE = <TtsSettingsPanel warm />;
const PODCASTS = <PodcastSettings />;

/**
 * The body of Settings: the list, and each pane under it, in one place and
 * one at a time. Each is kept once built, and the ones not yet opened are
 * built ahead while hidden, so a press on a row reveals a pane that is already
 * there (`KeptAlive`).
 */
export function SettingsPanes({ pane, warm, home, samwell }: SettingsPanesProps) {
  return (
    <>
      <KeptAlive active={pane === null} warm>
        <SettingsHome {...home} />
      </KeptAlive>
      <KeptAlive active={pane === 'profile'} warm={warm.profile} className="gap-4">
        {PROFILE}
      </KeptAlive>
      <KeptAlive active={pane === 'samwell'} warm={warm.samwell}>
        <SamwellSection {...samwell} />
      </KeptAlive>
      <KeptAlive active={pane === 'voice'} warm={warm.voice}>
        {VOICE}
      </KeptAlive>
      <KeptAlive active={pane === 'podcasts'} warm={warm.podcasts}>
        {PODCASTS}
      </KeptAlive>
    </>
  );
}
