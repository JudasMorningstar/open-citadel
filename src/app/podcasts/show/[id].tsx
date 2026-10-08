import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft } from "@/components/icons";
import { ListEmpty } from "@/components/list-empty";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { iconSize, layout } from "@/constants/theme";
import { EpisodeActionSheet } from "@/features/podcasts/components/episode-action-sheet";
import { EpisodeListSkeleton } from "@/features/podcasts/components/episode-list-skeleton";
import { MiniPlayer } from "@/features/podcasts/components/mini-player";
import { ShowEpisodeList } from "@/features/podcasts/components/show-episode-list";
import { ShowListHeader } from "@/features/podcasts/components/show-list-header";
import { ShowPageSkeleton } from "@/features/podcasts/components/show-page-skeleton";
import { ShowSettingsSheet } from "@/features/podcasts/components/show-settings-sheet";
import { UnfollowSheet } from "@/features/podcasts/components/unfollow-sheet";
import { useEpisodeActions } from "@/features/podcasts/hooks/use-episode-actions";
import { useEpisodeRowRenderer } from "@/features/podcasts/hooks/use-episode-row-renderer";
import { useMiniPlayer } from "@/features/podcasts/hooks/use-mini-player";
import { useShowScreen, type ShowParams } from "@/features/podcasts/hooks/use-show-screen";
import { useShowSheets } from "@/features/podcasts/hooks/use-show-sheets";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";
import type { EpisodeItem } from "@/services/podcasts/records";

const NO_EPISODES: EpisodeItem[] = [];

/**
 * A show: its hero, and every episode it has published.
 *
 * Opened with `id=discover` and what Explore knew about it, this is also the
 * preview of a show not yet followed: fully playable, with FOLLOW as the one
 * gold thing on the page.
 */
export default function ShowScreen() {
  const params = useLocalSearchParams<ShowParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const episodeActions = useEpisodeActions();
  const miniPlayer = useMiniPlayer(insets.bottom);
  const screen = useShowScreen(params, landed);
  const sheets = useShowSheets(screen.show, screen.unfollow);
  const renderItem = useEpisodeRowRenderer(episodeActions);

  // The list is mounted from the first frame with the hero as its header, so
  // the hero is drawn once and never swapped: a placeholder copy of it,
  // dissolving onto the list's own, blinked the cover. Only the rows wait
  // for the slide to land (a list of rows mounting mid-slide froze it), with
  // their skeleton in their place.
  const episodes = landed ? screen.episodes : NO_EPISODES;
  const empty = !landed || screen.resolving ? <EpisodeListSkeleton /> : <ListEmpty text={screen.emptyText} />;
  const header = <ShowListHeader screen={screen} onUnfollow={sheets.openUnfollow} onSettings={sheets.openSettings} />;
  // Nothing known yet (a show no cache holds, opened from the player): its shape until the read lands.
  const known = screen.title !== '';

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title=""
        leftIcon={<ChevronLeft size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Back"
        onLeftPress={() => router.back()}
      />
      {known ? (
        <ShowEpisodeList
          episodes={episodes}
          renderItem={renderItem}
          header={header}
          empty={empty}
          bottomPadding={layout.scrollBottom + insets.bottom + miniPlayer.clearance}
          canRefresh={screen.showId !== null}
          refreshing={screen.refreshing}
          onRefresh={screen.refresh}
        />
      ) : (
        <ShowPageSkeleton />
      )}
      {miniPlayer.props ? <MiniPlayer {...miniPlayer.props} /> : null}
      {landed ? (
        <>
          <EpisodeActionSheet {...episodeActions.sheet} showLink={false} />
          <ShowSettingsSheet {...sheets.settings} />
          <UnfollowSheet {...sheets.unfollow} title={screen.title} />
        </>
      ) : null}
    </ThemedView>
  );
}
