
import { KeptAlive } from "@/components/kept-alive";
import type { EngineMode } from "@/components/settings/engine-info-sheet";
import { ThemeScope } from "@/components/theme-scope";
import { ViewSwitcher } from "@/components/view-switcher";
import { PodcastSettings } from "@/features/podcasts/components/podcast-settings-section";
import { AccountCard } from "@/features/settings/components/account-card";
import { DisplayNameCard } from "@/features/settings/components/display-name-card";
import { SamwellSection } from "@/features/settings/components/samwell-section";
import {
    SettingsHome,
    type SettingsHomeProps,
} from "@/features/settings/components/settings-home";
import { SettingsPage } from "@/features/settings/components/settings-page";
import {
    PANE_TITLES,
    SETTINGS_PANES,
    type SettingsPane,
} from "@/features/settings/utils/panes";
import { TtsSettingsPanel } from "@/features/tts/components/tts-settings-panel";

export type SettingsPanesProps = {
  /** The pane showing, or null for the list. */
  pane: SettingsPane | null;
  /** The panes to build before they are opened. */
  warm: Record<SettingsPane, boolean>;
  home: SettingsHomeProps;
  samwell: { onRequestAccount: () => void; initialMode?: EngineMode };
  onLeave: () => void;
};

const PAGE_ORDER = ["home", ...SETTINGS_PANES] as const;

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
export function SettingsPanes({
  pane,
  warm,
  home,
  samwell,
  onLeave,
}: SettingsPanesProps) {
  const pages = {
    home: (
      <SettingsPage
        title="Settings"
        leaves="down"
        onLeave={onLeave}
        active={pane === null}
      >
        <KeptAlive active={pane === null} visible warm>
          <SettingsHome {...home} />
        </KeptAlive>
      </SettingsPage>
    ),
    profile:
      warm.profile || pane === "profile" ? (
        <SettingsPage
          title={PANE_TITLES.profile}
          leaves="back"
          onLeave={onLeave}
          active={pane === "profile"}
        >
          <KeptAlive
            active={pane === "profile"}
            visible
            warm={warm.profile}
            className="gap-4"
          >
            <ThemeScope urgent={pane === "profile"}>{PROFILE}</ThemeScope>
          </KeptAlive>
        </SettingsPage>
      ) : null,
    samwell:
      warm.samwell || pane === "samwell" ? (
        <SettingsPage
          title={PANE_TITLES.samwell}
          leaves="back"
          onLeave={onLeave}
          active={pane === "samwell"}
        >
          <KeptAlive active={pane === "samwell"} visible warm={warm.samwell}>
            <ThemeScope urgent={pane === "samwell"}>
              <SamwellSection {...samwell} />
            </ThemeScope>
          </KeptAlive>
        </SettingsPage>
      ) : null,
    voice:
      warm.voice || pane === "voice" ? (
        <SettingsPage
          title={PANE_TITLES.voice}
          leaves="back"
          onLeave={onLeave}
          active={pane === "voice"}
        >
          <KeptAlive active={pane === "voice"} visible warm={warm.voice}>
            <ThemeScope urgent={pane === "voice"}>{VOICE}</ThemeScope>
          </KeptAlive>
        </SettingsPage>
      ) : null,
    podcasts:
      warm.podcasts || pane === "podcasts" ? (
        <SettingsPage
          title={PANE_TITLES.podcasts}
          leaves="back"
          onLeave={onLeave}
          active={pane === "podcasts"}
        >
          <KeptAlive active={pane === "podcasts"} visible warm={warm.podcasts}>
            <ThemeScope urgent={pane === "podcasts"}>{PODCASTS}</ThemeScope>
          </KeptAlive>
        </SettingsPage>
      ) : null,
  };

  return (
    <ViewSwitcher
      order={PAGE_ORDER}
      value={pane ?? "home"}
      sides={pages}
      page
    />
  );
}
