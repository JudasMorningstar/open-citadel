import React from 'react';

import { ShelvesPreview, type PreviewShelf } from '@/components/shelves-preview';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { BlogTile } from '@/features/blogs/components/blog-tile';
import type { DirectoryBlog, DirectorySection } from '@/services/blogs/directory';
import { hostOf } from '@/utils/urls';

/** What fits on the first screen: three sections, three tiles each (the third cut by the edge). */
const PREVIEW_SECTIONS = 3;
const PREVIEW_TILES = 3;

type ExplorePreviewProps = {
  sections: DirectorySection[];
  followed: Set<string>;
  onOpen: (blog: DirectoryBlog) => void;
};

/**
 * Blogs' first screen while the drawer rises. The directory ships with the
 * app, so unlike the other Explores this never waits on a cache: Blogs'
 * Explore opens on its blogs every time. See `ShelvesPreview`.
 */
export function ExplorePreview({ sections, followed, onOpen }: ExplorePreviewProps) {
  const shelves: PreviewShelf[] = sections.slice(0, PREVIEW_SECTIONS).map((section) => ({
    key: section.id,
    title: section.label,
    tiles: section.blogs.slice(0, PREVIEW_TILES).map((blog) => (
      <BlogTile
        key={blog.feedUrl}
        id={blog.feedUrl}
        title={blog.title}
        author={hostOf(blog.feedUrl)}
        artworkUrl={blog.imageUrl ?? null}
        following={followed.has(blog.feedUrl)}
        width={SHELF_TILE_WIDTH}
        onPress={() => onOpen(blog)}
      />
    )),
  }));
  return <ShelvesPreview shelves={shelves} />;
}
