import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Plus } from "@/components/icons";
import { Handover } from "@/components/navigation/handover";
import { fabClearance } from "@/components/fab-placement";
import { ScreenFab } from "@/components/screen-fab";
import { EpisodeActionSheet } from "@/features/podcasts/components/episode-action-sheet";
import { ImportView } from "@/features/podcasts/components/import-view";
import { NoShowsYet } from "@/features/podcasts/components/no-shows-yet";
import { PodcastsHomeSkeleton } from "@/features/podcasts/components/podcasts-home-skeleton";
import { PodcastsHome } from "@/features/podcasts/components/podcasts-home";
import { PodcastsWelcome } from "@/features/podcasts/components/podcasts-welcome";
import { usePodcastsPage } from "@/features/podcasts/hooks/use-podcasts-page";
import { useSettledAfter } from "@/navigation/use-settled-after";

const SWITCH_SETTLE_MS = 300;

type PodcastsPageProps = {
  /** Room kept free at the bottom for the mini player, when one is showing. */
  bottomChrome: number;
};

/** The podcasts side of the Library, wired: the welcome the first time, an import while one runs, the shelves after. */
export function PodcastsPage({ bottomChrome }: PodcastsPageProps) {
  const insets = useSafeAreaInsets();
  const page = usePodcastsPage();
  // After the Library switch's fade (250ms) has run, so the shelves do not
  // mount under a moving surface.
  const landed = useSettledAfter(SWITCH_SETTLE_MS);
  const { importer, episodes } = page;

  if (importer.active) return <ImportView state={importer.active} onDone={importer.reset} onRetry={importer.start} />;
  if (page.view === "welcome") return <PodcastsWelcome onStartFresh={page.startFresh} onImport={importer.start} />;

  return (
    <View className="flex-1">
      {/* Drawn the way the books side boots: the page's shape at once, the
          shelves once the switch has finished moving and the library is read. */}
      <Handover ready={landed && page.view === "home"} skeleton={<PodcastsHomeSkeleton />}>
        <PodcastsHome
          home={page.home}
          refreshing={page.pulling}
          bottomPadding={bottomChrome + fabClearance(insets.bottom)}
          emptyState={page.followsNothing ? <NoShowsYet onExplore={page.openExplore} /> : null}
          onRefresh={page.refresh}
          onViewAll={page.viewAll}
          onOpenEpisode={episodes.openEpisode}
          onOpenShow={episodes.openShow}
          onEpisodeMenu={episodes.openMenu}
          onPlay={episodes.play}
        />
      </Handover>
      {/* The side's one creative action, the same floating button the books
          side and the Timeline give theirs: find something new to follow. */}
      <ScreenFab icon={Plus} accessibilityLabel="Add a podcast" bottomOffset={insets.bottom + bottomChrome} onPress={page.openExplore} />
      <EpisodeActionSheet {...episodes.sheet} />
    </View>
  );
}
