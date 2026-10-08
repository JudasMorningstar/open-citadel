import React from 'react';

import { TileGrid } from '@/components/tile-grid';
import { BlogTile } from '@/features/blogs/components/blog-tile';
import type { BlogItem } from '@/services/blogs/records';
import { hostOf } from '@/utils/urls';

const keyOf = (blog: BlogItem) => blog.id;

type BlogGridProps = {
  blogs: BlogItem[];
  empty: React.ReactElement;
  bottomPadding: number;
  onOpen: (blogId: string) => void;
};

/** The blogs followed, two to a row. */
export function BlogGrid({ blogs, empty, bottomPadding, onOpen }: BlogGridProps) {
  const renderTile = React.useCallback(
    (blog: BlogItem, width: number) => (
      <BlogTile
        id={blog.id}
        title={blog.title}
        author={hostOf(blog.siteUrl ?? blog.feedUrl)}
        artworkUrl={blog.imageUrl}
        newCount={blog.newCount}
        width={width}
        onPress={onOpen}
      />
    ),
    [onOpen],
  );
  return <TileGrid items={blogs} keyOf={keyOf} renderTile={renderTile} empty={empty} bottomPadding={bottomPadding} />;
}
