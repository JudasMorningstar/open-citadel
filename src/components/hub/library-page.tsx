import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlogsPage } from "@/components/hub/blogs-page";
import { BooksPage } from "@/components/hub/books-page";
import { LibraryHeader } from "@/components/hub/library-header";
import { PodcastsPage } from "@/components/hub/podcasts-page";
import { ThemeScope } from "@/components/theme-scope";
import { ViewSwitcher } from "@/components/view-switcher";
import { useLibraryPage } from "@/features/library/hooks/use-library-page";
import { LIBRARY_TAB_ORDER } from "@/features/library/components/library-tabs";
import { MiniPlayer } from "@/features/podcasts/components/mini-player";
import { useMiniPlayer } from "@/features/podcasts/hooks/use-mini-player";
import { librarySideOrder } from "@/utils/theme-order";

/**
 * The Library: books, podcasts and blogs, one header, one switch between them.
 *
 * The header is the hub's map, as it always was: the Timeline to one side,
 * Samwell to the other, drawn with their own icons. Its middle, which used to
 * say "Library", is now the switch that says which library this is. Each side
 * owns everything under the header, its own skeleton included, and is mounted
 * when it is first opened; this only decides which one is showing and keeps
 * the mini player above them.
 *
 * `themeOrder` is the Library's turn when the theme changes. The header, the
 * mini player and each side are theme scopes side by side, never one inside
 * another (`components/theme-scope`): the side showing changes with the
 * header, the other two after every page of the hub has.
 */
export function LibraryPage({ themeOrder }: { themeOrder: number }) {
  const insets = useSafeAreaInsets();
  const page = useLibraryPage();
  const miniPlayer = useMiniPlayer(insets.bottom);
  const chrome = miniPlayer.clearance;
  const { mounted, settleMs, tab } = page;
  const sides = {
    books: mounted.books ? (
      <ThemeScope order={librarySideOrder(0, tab === "books", themeOrder)}>
        <BooksPage bottomChrome={chrome} booted={page.booted} settleMs={settleMs.books} />
      </ThemeScope>
    ) : null,
    podcasts: mounted.podcasts ? (
      <ThemeScope order={librarySideOrder(1, tab === "podcasts", themeOrder)}>
        <PodcastsPage bottomChrome={chrome} settleMs={settleMs.podcasts} />
      </ThemeScope>
    ) : null,
    blogs: mounted.blogs ? (
      <ThemeScope order={librarySideOrder(2, tab === "blogs", themeOrder)}>
        <BlogsPage bottomChrome={chrome} settleMs={settleMs.blogs} />
      </ThemeScope>
    ) : null,
  };

  return (
    <View className="flex-1" style={{ paddingTop: insets.top }}>
      <ThemeScope order={themeOrder}>
        <LibraryHeader
          tab={tab}
          onChangeTab={page.changeTab}
          onOpenTimeline={page.openTimeline}
          onOpenSamwell={page.openSamwell}
        />
      </ThemeScope>
      <ViewSwitcher order={LIBRARY_TAB_ORDER} value={tab} sides={sides} />
      {miniPlayer.props ? (
        <ThemeScope order={themeOrder}>
          <MiniPlayer {...miniPlayer.props} />
        </ThemeScope>
      ) : null}
    </View>
  );
}
