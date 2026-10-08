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
import { explorePreviewReady } from "@/features/podcasts/utils/explore-preview";
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
  // Seen before (the charts are cached): the page opens on its shelves, in
  // the real scroller, so it can be scrolled as it arrives.
  // Decided once, as the page opens: charts asked for at the tap arrive during
  // the rise, and trading a skeleton for nine tiles then is the mount
  // mid-slide this is here to avoid.
  const [previewed] = React.useState(() => explorePreviewReady(explore.charts));
  const charts = (
    <ExploreCharts
      charts={explore.charts}
      isFollowed={explore.isFollowed}
      bottomPadding={bottomPadding}
      ready={landed}
      onOpen={explore.openShow}
      onViewAll={explore.openGenre}
      onImport={importer.openGuide}
    />
  );

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
        ) : previewed ? (
          charts
        ) : (
          // Not seen before: a skeleton holds the page while the charts are
          // fetched, and the shelves mount under it once the drawer has
          // finished rising (a list landing mid-rise makes a drawer stagger).
          <Handover ready={landed} skeleton={<ExploreSkeleton />}>
            {charts}
          </Handover>
        )}
      </View>
      {landed ? <ImportGuideSheet {...importer.guide} /> : null}
    </ThemedView>
  );
}
