import React from 'react';
import { View } from 'react-native';

import { ChevronRight, Newspaper } from '@/components/icons';
import { PageFade } from '@/components/scroll-fades';
import { SquareArtwork } from '@/components/square-artwork';
import { ThemedText } from '@/components/themed-text';
import { Item } from '@/components/ui/item';
import { SearchBar } from '@/components/ui/search-bar';
import { Sheet } from '@/components/ui/sheet';
import { ArticlePickerSkeleton } from '@/features/blogs/components/article-picker-skeleton';
import { articleMeta } from '@/features/blogs/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ArticleItem } from '@/services/blogs/records';
import { matchesQuery } from '@/utils/format';
import { monogramOf } from '@/utils/monogram';

const ART = 56;
const FILL = { flex: 1 } as const;

type ArticlePickerSheetProps = {
  visible: boolean;
  /** Undefined until the list has been read. */
  articles: ArticleItem[] | undefined;
  onSelect: (article: ArticleItem) => void;
  onClose: () => void;
};

function RowSeparator() {
  return <Item.Separator />;
}

/** One post: its picture, its blog and date, and its title, at one height so the list skims. */
const ArticleOption = React.memo(function ArticleOption({
  article,
  onSelect,
}: {
  article: ArticleItem;
  onSelect: (article: ArticleItem) => void;
}) {
  const tokens = useThemeTokens();
  return (
    <Item className="px-6 py-3" onPress={() => onSelect(article)}>
      <SquareArtwork
        uri={article.imageUrl ?? article.blogImageUrl}
        fallbackIcon={Newspaper}
        monogram={monogramOf(article.blogTitle)}
        size={ART}
        recyclingKey={article.id}
        placeholderColor={tokens['--color-surface-tertiary']}
      />
      <Item.Content>
        <Item.Description numberOfLines={1} style={{ fontSize: 12, lineHeight: 16 }}>
          {articleMeta(article, true)}
        </Item.Description>
        <Item.Title numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
          {article.title}
        </Item.Title>
      </Item.Content>
      <Item.Actions>
        <ChevronRight size={16} color={tokens['--color-muted-foreground']} />
      </Item.Actions>
    </Item>
  );
});

/**
 * The post picker: a search over every post, one tap to attach a post to the
 * chat. The book picker's sibling (`BookPickerSheet`), at its fixed height
 * and with its uncontrolled search field, so the two open alike from the
 * same toolbox.
 */
export function ArticlePickerSheet({ visible, articles, onSelect, onClose }: ArticlePickerSheetProps) {
  const tokens = useThemeTokens();
  const [query, setQuery] = React.useState('');
  const deferredQuery = React.useDeferredValue(query);
  // Remounts the uncontrolled field on the next open, so no text survives a close.
  const [fieldEpoch, setFieldEpoch] = React.useState(0);

  const filtered = React.useMemo(
    () => articles?.filter((a) => matchesQuery(deferredQuery, a.title, a.blogTitle)) ?? [],
    [articles, deferredQuery],
  );
  const renderItem = React.useCallback(
    ({ item }: { item: ArticleItem }) => <ArticleOption article={item} onSelect={onSelect} />,
    [onSelect],
  );

  const handleClose = () => {
    setFieldEpoch((epoch) => epoch + 1);
    setQuery('');
    onClose();
  };

  const loaded = articles !== undefined;
  const emptyText = articles?.length === 0 ? 'No posts yet. Follow a blog in the Library.' : 'No posts found';

  return (
    <Sheet visible={visible} onClose={handleClose} fixedHeightRatio={0.7}>
      <View className="flex-row items-center justify-between px-6 pb-3">
        <ThemedText type="headlineSm">Pick a post</ThemedText>
      </View>
      <View className="mx-6 mb-3">
        <SearchBar key={fieldEpoch} variant="filled" placeholder="Search posts…" onChangeText={setQuery} />
      </View>
      <Sheet.Deferred skeleton={<ArticlePickerSkeleton />}>
        {!loaded ? (
          <ArticlePickerSkeleton />
        ) : filtered.length === 0 ? (
          <View className="flex-1 items-center p-4">
            <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
              {emptyText}
            </ThemedText>
          </View>
        ) : (
          <PageFade edges="both" surface="popover">
            <Sheet.FlatList
              style={FILL}
              data={filtered}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={RowSeparator}
              keyboardShouldPersistTaps="handled"
              renderItem={renderItem}
            />
          </PageFade>
        )}
      </Sheet.Deferred>
    </Sheet>
  );
}
