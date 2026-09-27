import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronDown } from "@/components/icons";
import { Handover } from "@/components/navigation/handover";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SearchBar } from "@/components/ui/search-bar";
import { contentColumn, iconSize, layout } from "@/constants/theme";
import { DiscoverRow } from "@/features/podcasts/components/discover-row";
import { ExploreCharts } from "@/features/podcasts/components/explore-charts";
import { ExploreResults } from "@/features/podcasts/components/explore-results";
import { ExploreSkeleton } from "@/features/podcasts/components/explore-skeleton";
import { ImportGuideSheet } from "@/features/podcasts/components/onboarding/import-guide-sheet";
import { ImportView } from "@/features/podcasts/components/onboarding/import-view";
import { useExploreScreen } from "@/features/podcasts/hooks/use-explore-screen";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/**
 * Finding something to listen to: Apple's charts a shelf per genre, a search
 * over Apple's directory, any feed or Apple link pasted into the same field,
 * and the AntennaPod import at the foot.
 */
export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const explore = useExploreScreen(landed);
  const { importer } = explore;
  const bottomPadding = layout.scrollBottom + insets.bottom;

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title="Explore"
        leftIcon={<ChevronDown size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Close"
        onLeftPress={explore.close}
      />
      {/* An import has the page to itself: searching mid-import would only
          hide what it is doing. */}
      {importer.active ? null : (
        <View className="px-6 pb-2" style={contentColumn}>
          <SearchBar
            variant="filled"
            placeholder="Search shows, or paste a link"
            debounce={350}
            onDebouncedChange={explore.setQuery}
            onClear={explore.clearQuery}
            loading={explore.searching}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      )}
      <View className="flex-1">
        {importer.active ? (
          <ImportView
            state={importer.active}
            bottomPadding={insets.bottom + layout.gutter}
            onDone={explore.close}
            onRetry={importer.start}
            onCancel={importer.reset}
          />
        ) : explore.view === "link" ? (
          <DiscoverRow id="link" title="Open this show" subtitle={explore.term} artworkUrl={null} following={false} onPress={explore.openLink} />
        ) : explore.view === "search" ? (
          <ExploreResults
            results={explore.results}
            emptyText={explore.searchEmptyText}
            isFollowed={explore.isFollowed}
            bottomPadding={bottomPadding}
            onOpen={explore.openResult}
          />
        ) : (
          // The shelves mount when the drawer has actually finished rising.
          // Even virtualized, a list renders in several passes, and a pass
          // landing mid-rise is what made the drawer stagger. The skeleton
          // holds their shape and dissolves into them.
          <Handover ready={landed} skeleton={<ExploreSkeleton />}>
            <ExploreCharts
              charts={explore.charts}
              isFollowed={explore.isFollowed}
              bottomPadding={bottomPadding}
              onOpen={explore.openShow}
              onViewAll={explore.openGenre}
              onImport={importer.openGuide}
            />
          </Handover>
        )}
      </View>
      {landed ? <ImportGuideSheet {...importer.guide} /> : null}
    </ThemedView>
  );
}
