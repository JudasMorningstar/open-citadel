import { useLocalSearchParams } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft } from "@/components/icons";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { iconSize } from "@/constants/theme";
import { CatalogGrid } from "@/features/free-books/components/catalog-grid";
import { useCatalogShelfScreen } from "@/features/free-books/hooks/use-catalog-shelf-screen";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/** A whole Project Gutenberg shelf, two books to a row, from its VIEW ALL. */
export default function CatalogShelfScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const screen = useCatalogShelfScreen(id);

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title={screen.title}
        leftIcon={<ChevronLeft size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Back"
        onLeftPress={screen.back}
      />
      <CatalogGrid
        books={screen.books}
        ready={landed && !screen.loading}
        loadingMore={screen.loadingMore}
        emptyText={screen.emptyText}
        bottomInset={insets.bottom}
        onOpen={screen.open}
        onEndReached={screen.loadMore}
      />
    </ThemedView>
  );
}
