import React from 'react';
import { View } from 'react-native';

import { ChevronRight, Newspaper } from '@/components/icons';
import { SquareArtwork } from '@/components/square-artwork';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { DirectoryBlog } from '@/services/blogs/directory';
import { monogramOf } from '@/utils/monogram';

const ART = 48;

type DirectoryRowProps = {
  blog: DirectoryBlog;
  following: boolean;
  onPress: (blog: DirectoryBlog) => void;
};

/** A search result: the blog's initials, its name, what it is about, and whether it is followed already. */
export const DirectoryRow = React.memo(function DirectoryRow({ blog, following, onPress }: DirectoryRowProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <Touchable
      className="flex-row items-center gap-4 px-6 py-3"
      onPress={() => onPress(blog)}
      accessibilityRole="button"
      accessibilityLabel={following ? `${blog.title}, following` : blog.title}
    >
      <SquareArtwork
        uri={blog.imageUrl ?? null}
        fallbackIcon={Newspaper}
        monogram={monogramOf(blog.title)}
        size={ART}
        recyclingKey={blog.feedUrl}
      />
      <View className="flex-1 gap-0.5">
        <ThemedText type="headlineSm" numberOfLines={1}>
          {blog.title}
        </ThemedText>
        <ThemedText
          type={following ? 'labelSm' : 'bodySm'}
          color={following ? tokens['--color-primary'] : muted}
          numberOfLines={2}
        >
          {following ? 'Following' : blog.blurb}
        </ThemedText>
      </View>
      <ChevronRight size={18} color={muted} />
    </Touchable>
  );
});
