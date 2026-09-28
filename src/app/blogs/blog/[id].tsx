import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ChevronLeft } from "@/components/icons";
import { ListEmpty } from "@/components/list-empty";
import { Handover } from "@/components/navigation/handover";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { iconSize, layout } from "@/constants/theme";
import { ArticleActionSheet } from "@/features/blogs/components/article-action-sheet";
import { ArticleListSkeleton } from "@/features/blogs/components/article-list-skeleton";
import { BlogArticleList } from "@/features/blogs/components/blog-article-list";
import { BlogHero } from "@/features/blogs/components/blog-hero";
import { BlogPageSkeleton } from "@/features/blogs/components/blog-page-skeleton";
import { useArticleActions } from "@/features/blogs/hooks/use-article-actions";
import { useArticleRowRenderer } from "@/features/blogs/hooks/use-article-row-renderer";
import { useBlogScreen, type BlogParams } from "@/features/blogs/hooks/use-blog-screen";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useSettledOnce } from "@/navigation/use-settled-once";

/**
 * A blog: its hero, and every post of it kept here.
 *
 * Opened with `id=found` and the feed Explore knew it by, this is also the
 * preview of a blog not yet followed: every post readable, with FOLLOW as
 * the one gold thing on the page.
 */
export default function BlogScreen() {
  const params = useLocalSearchParams<BlogParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tokens = useThemeTokens();
  const landed = useSettledOnce();
  const screen = useBlogScreen(params, landed);
  const actions = useArticleActions();
  const renderItem = useArticleRowRenderer(actions, { withBlog: false });

  const empty = screen.resolving ? <ArticleListSkeleton /> : <ListEmpty text={screen.emptyText} />;
  const header = <BlogHero {...screen.hero} />;

  return (
    <ThemedView className="flex-1" style={{ paddingTop: insets.top }}>
      <ScreenHeader
        title=""
        leftIcon={<ChevronLeft size={iconSize.default} color={tokens["--color-foreground"]} />}
        leftLabel="Back"
        onLeftPress={() => router.back()}
      />
      <Handover ready={landed} skeleton={<BlogPageSkeleton />}>
        <BlogArticleList
          articles={screen.articles}
          renderItem={renderItem}
          header={header}
          empty={empty}
          bottomPadding={layout.scrollBottom + insets.bottom}
          canRefresh={screen.canRefresh}
          refreshing={screen.refreshing}
          onRefresh={screen.refresh}
        />
      </Handover>
      {landed ? <ArticleActionSheet {...actions.sheet} blogLink={false} /> : null}
    </ThemedView>
  );
}
