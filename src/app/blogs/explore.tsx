import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronDown } from "@/components/icons";
import { Handover } from "@/components/navigation/handover";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SearchBar } from "@/components/ui/search-bar";
import { contentColumn, iconSize, layout } from "@/constants/theme";
import { ExploreResults } from "@/features/blogs/components/explore-results";
import { ExplorePreview } from "@/features/blogs/components/explore-preview";
import { ExploreSections } from "@/features/blogs/components/explore-sections";
import { useBlogsExplore } from "@/features/blogs/hooks/use-blogs-explore";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/**
 * Blogs worth following, by section, and a search over them that also takes
 * any blog's address, laid out like the podcasts' and free books' Explore.
 */
export default function BlogsExploreScreen() {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const explore = useBlogsExplore();
  const bottomPadding = layout.scrollBottom + insets.bottom;

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title="Blogs"
        leftIcon={<ChevronDown size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Close"
        onLeftPress={explore.close}
      />
      <View className="px-6 pb-2" style={contentColumn}>
        <SearchBar
          variant="filled"
          placeholder="Search blogs, or paste an address"
          debounce={250}
          onDebouncedChange={explore.setQuery}
          onClear={explore.clearQuery}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      <View className="flex-1">
        {explore.view === "search" ? (
          <ExploreResults
            results={explore.results}
            followed={explore.followed}
            address={explore.address}
            emptyText={explore.searchEmptyText}
            bottomPadding={bottomPadding}
            onOpen={explore.openBlog}
            onOpenAddress={explore.openAddress}
          />
        ) : (
          // The sections mount when the drawer has finished rising: a list
          // landing mid-rise is what makes a drawer stagger. Their first
          // screen stands in meanwhile (the directory ships with the app).
          <Handover
            ready={landed}
            skeleton={<ExplorePreview sections={explore.sections} followed={explore.followed} onOpen={explore.openBlog} />}
          >
            <ExploreSections
              sections={explore.sections}
              followed={explore.followed}
              bottomPadding={bottomPadding}
              onOpen={explore.openBlog}
            />
          </Handover>
        )}
      </View>
    </ThemedView>
  );
}
