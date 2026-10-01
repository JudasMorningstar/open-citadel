import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCSSVariable } from "uniwind";

import { BlogsPage } from "@/components/hub/blogs-page";
import { BooksPage } from "@/components/hub/books-page";
import { PodcastsPage } from "@/components/hub/podcasts-page";
import { ChartNoAxesGantt, ZodiacPisces } from "@/components/icons";
import { ThemedView } from "@/components/themed-view";
import { ViewSwitcher } from "@/components/view-switcher";
import { ScreenHeader } from "@/components/ui/screen-header";
import { iconSize } from "@/constants/theme";
import { useLibraryPage } from "@/features/library/hooks/use-library-page";
import { LIBRARY_TAB_ORDER, LibraryTabs } from "@/features/library/components/library-tabs";
import { MiniPlayer } from "@/features/podcasts/components/mini-player";
import { useMiniPlayer } from "@/features/podcasts/hooks/use-mini-player";
import { asColor } from "@/utils/colors";

/**
 * The Library: books, podcasts and blogs, one header, one switch between them.
 *
 * The header is the hub's map, as it always was: the Timeline to one side,
 * Samwell to the other, drawn with their own icons. Its middle, which used to
 * say "Library", is now the switch that says which library this is. Each side
 * owns everything under the header; this only decides which one is showing
 * and keeps the mini player above both.
 */
export function LibraryPage() {
  const insets = useSafeAreaInsets();
  const [foreground, primary] = useCSSVariable(["--color-foreground", "--color-primary"]);
  const page = useLibraryPage();
  const miniPlayer = useMiniPlayer(insets.bottom);
  const chrome = miniPlayer.clearance;
  const sides = {
    books: <BooksPage bottomChrome={chrome} />,
    podcasts: page.mounted.podcasts ? <PodcastsPage bottomChrome={chrome} /> : null,
    blogs: page.mounted.blogs ? <BlogsPage bottomChrome={chrome} /> : null,
  };

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title="Library"
        center={<LibraryTabs value={page.tab} onChange={page.changeTab} />}
        leftIcon={<ChartNoAxesGantt size={iconSize.default} color={asColor(foreground)} />}
        leftLabel="Timeline"
        onLeftPress={page.openTimeline}
        // His mark carries the gold everywhere it appears, so the one control
        // on this header that is him reads as him.
        rightIcon={<ZodiacPisces size={iconSize.default} color={asColor(primary)} />}
        rightLabel="Samwell"
        onRightPress={page.openSamwell}
      />
      <ViewSwitcher order={LIBRARY_TAB_ORDER} value={page.tab} sides={sides} />
      {miniPlayer.props ? <MiniPlayer {...miniPlayer.props} /> : null}
    </ThemedView>
  );
}
