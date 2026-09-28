import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft, Share } from "@/components/icons";
import { Handover } from "@/components/navigation/handover";
import { PageFade } from "@/components/scroll-fades";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { contentColumn, iconSize, layout } from "@/constants/theme";
import { ChapterList } from "@/features/podcasts/components/chapter-list";
import { EpisodeHero } from "@/features/podcasts/components/episode-hero";
import { EpisodePageSkeleton } from "@/features/podcasts/components/episode-page-skeleton";
import { EpisodeSection } from "@/features/podcasts/components/episode-section";
import { MiniPlayer } from "@/features/podcasts/components/mini-player";
import { ShowNotesView } from "@/features/podcasts/components/show-notes-view";
import { useEpisodeScreen } from "@/features/podcasts/hooks/use-episode-screen";
import { useMiniPlayer } from "@/features/podcasts/hooks/use-mini-player";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/**
 * An episode: its hero and actions, its chapters, and its show notes.
 *
 * The whole page is held back until the screen has settled, behind a
 * skeleton of its shape: the notes can run to a few thousand words, and
 * setting them mid-slide costs frames the slide needs.
 */
export default function EpisodeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const screen = useEpisodeScreen(id);
  const miniPlayer = useMiniPlayer(insets.bottom);
  const { episode, hero } = screen;

  const body = episode ? (
    <PageFade>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-6 pt-2"
        contentContainerStyle={{ paddingBottom: layout.scrollBottom + insets.bottom + miniPlayer.clearance }}
        showsVerticalScrollIndicator={false}
      >
        <View style={contentColumn}>
          <EpisodeHero
            episode={episode}
            showTitle={screen.showTitle}
            artworkUrl={screen.artworkUrl}
            playback={screen.playback}
            onPlay={hero.play}
            onOpenShow={hero.openShow}
            onToggleQueue={hero.toggleQueue}
            onDownload={hero.download}
            onRemoveDownload={hero.removeDownload}
            onToggleFavorite={hero.toggleFavorite}
            onTogglePlayed={hero.togglePlayed}
          />
        </View>
        {screen.chapters.length > 0 ? (
          <EpisodeSection title="Chapters">
            <ChapterList chapters={screen.chapters} onSelect={screen.playFrom} />
          </EpisodeSection>
        ) : null}
        {screen.notes.length > 0 ? (
          <EpisodeSection title="Show Notes">
            <ShowNotesView blocks={screen.notes} onSeek={screen.playFrom} onLink={screen.openLink} />
          </EpisodeSection>
        ) : null}
      </ScrollView>
    </PageFade>
  ) : (
    <View className="flex-1 items-center justify-center px-10">
      <ThemedText type="bodyMd" color={tokens["--color-muted-foreground"]}>
        This episode is no longer here.
      </ThemedText>
    </View>
  );

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title=""
        leftIcon={<ChevronLeft size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Back"
        onLeftPress={screen.back}
        rightIcon={screen.share ? <Share size={18} color={tokens["--color-foreground"]} /> : undefined}
        rightLabel="Share"
        onRightPress={screen.share ?? undefined}
      />
      {/* The page mounts once the slide has landed and the episode has been
          read: mounting it mid-slide froze the transition partway. */}
      <Handover ready={landed && screen.loaded} skeleton={<EpisodePageSkeleton />}>
        {body}
      </Handover>
      {miniPlayer.props ? <MiniPlayer {...miniPlayer.props} /> : null}
    </ThemedView>
  );
}
