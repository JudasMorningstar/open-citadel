import React from 'react';
import { View } from 'react-native';

import {
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  CircleCheckBig,
  ExternalLink,
  Newspaper,
  RotateCcw,
  Share,
  ZodiacPisces,
  type LucideIcon,
} from '@/components/icons';
import { MenuList } from '@/components/menu-list';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { articleMenu, type ArticleAction } from '@/features/blogs/utils/article-menu';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ArticleItem } from '@/services/blogs/records';

const ICONS: Record<ArticleAction, LucideIcon> = {
  open: BookOpen,
  // His mark, wherever a row is him.
  chat: ZodiacPisces,
  save: BookmarkPlus,
  unsave: BookmarkCheck,
  read: CircleCheckBig,
  unread: RotateCcw,
  original: ExternalLink,
  share: Share,
  blog: Newspaper,
};

type ArticleActionSheetProps = {
  visible: boolean;
  article: ArticleItem | null;
  /** Off on the blog's own page, where going to the blog goes nowhere. */
  blogLink?: boolean;
  onClose: () => void;
  onAction: (action: ArticleAction, article: ArticleItem) => void;
};

/**
 * Everything that can be done to one post, from a long press anywhere it
 * appears. The same menu on every surface; which rows appear is
 * `articleMenu`'s decision.
 */
export function ArticleActionSheet({ visible, article, blogLink = true, onClose, onAction }: ArticleActionSheetProps) {
  const tokens = useThemeTokens();
  // Held content through the close: the shell keeps the last children while
  // it animates away, so this renders nothing rather than unmounting.
  if (!article) return <Sheet visible={visible} onClose={onClose}>{null}</Sheet>;

  const select = (action: ArticleAction) => {
    onClose();
    onAction(action, article);
  };

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-4">
        <View className="gap-1 px-4">
          <ThemedText type="labelSm" color={tokens['--color-primary']} numberOfLines={1}>
            {article.blogTitle}
          </ThemedText>
          <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} numberOfLines={2}>
            {article.title}
          </ThemedText>
        </View>
        <MenuList rows={articleMenu(article, { blogLink })} icons={ICONS} onSelect={select} />
      </View>
    </Sheet>
  );
}
