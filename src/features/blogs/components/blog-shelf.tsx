import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { BlogTile } from '@/features/blogs/components/blog-tile';
import type { BlogItem } from '@/services/blogs/records';
import { hostOf } from '@/utils/urls';

type BlogShelfProps = {
  blogs: BlogItem[];
  onPress: (blogId: string) => void;
};

const keyOf = (blog: BlogItem) => blog.id;

/** The blogs followed, those with something new first. */
export const BlogShelf = React.memo(function BlogShelf({ blogs, onPress }: BlogShelfProps) {
  const renderTile = React.useCallback(
    (blog: BlogItem) => (
      <BlogTile
        id={blog.id}
        title={blog.title}
        author={hostOf(blog.siteUrl ?? blog.feedUrl)}
        artworkUrl={blog.imageUrl}
        newCount={blog.newCount}
        width={SHELF_TILE_WIDTH}
        onPress={onPress}
      />
    ),
    [onPress],
  );
  return <ShelfRow items={blogs} keyOf={keyOf} renderTile={renderTile} />;
});
