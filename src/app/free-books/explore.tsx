import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronDown } from "@/components/icons";
import { Handover } from "@/components/navigation/handover";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { SearchBar } from "@/components/ui/search-bar";
import { contentColumn, iconSize, layout } from "@/constants/theme";
import { CatalogResults } from "@/features/free-books/components/catalog-results";
import { CatalogShelves } from "@/features/free-books/components/catalog-shelves";
import { CatalogPreview, catalogPreviewReady } from "@/features/free-books/components/catalog-preview";
import { CatalogShelvesSkeleton } from "@/features/free-books/components/catalog-shelves-skeleton";
import { useFreeBooksExplore } from "@/features/free-books/hooks/use-free-books-explore";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/**
 * Free books from Project Gutenberg: its shelves, a row each, and a search
 * over its whole catalog, laid out like the podcasts' Explore.
 */
export default function FreeBooksExploreScreen() {
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const explore = useFreeBooksExplore(landed);
  const bottomPadding = layout.scrollBottom + insets.bottom;
  // Seen before (the shelves are cached): the first screen itself while the
  // drawer rises, rather than a skeleton of it.
  const placeholder = catalogPreviewReady(explore.shelves) ? (
    <CatalogPreview shelves={explore.shelves} onOpen={explore.openBook} onViewAll={explore.openShelf} />
  ) : (
    <CatalogShelvesSkeleton />
  );

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title="Free Books"
        leftIcon={<ChevronDown size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Close"
        onLeftPress={explore.close}
      />
      <View className="px-6 pb-2" style={contentColumn}>
        <SearchBar
          variant="filled"
          placeholder="Search titles and authors"
          debounce={450}
          onDebouncedChange={explore.setQuery}
          onClear={explore.clearQuery}
          loading={explore.searching}
          returnKeyType="search"
          autoCorrect={false}
        />
      </View>
      <View className="flex-1">
        {explore.view === "search" ? (
          <CatalogResults
            results={explore.results}
            emptyText={explore.searchEmptyText}
            bottomPadding={bottomPadding}
            onOpen={explore.openBook}
          />
        ) : (
          // The shelves mount when the drawer has finished rising: a list
          // landing mid-rise is what makes a drawer stagger.
          <Handover ready={landed} skeleton={placeholder}>
            <CatalogShelves
              shelves={explore.shelves}
              bottomPadding={bottomPadding}
              onViewableItemsChanged={explore.onViewableItemsChanged}
              onOpen={explore.openBook}
              onViewAll={explore.openShelf}
            />
          </Handover>
        )}
      </View>
    </ThemedView>
  );
}
