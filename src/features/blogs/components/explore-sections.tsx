import React from 'react';

import { ShelfRow } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';
import { ShelfStack } from '@/components/shelf-stack';
import { SHELF_TILE_WIDTH } from '@/constants/theme';
import { BlogsNotice } from '@/features/blogs/components/blogs-notice';
import { BlogTile } from '@/features/blogs/components/blog-tile';
import type { DirectoryBlog, DirectorySection } from '@/services/blogs/directory';
import { hostOf } from '@/utils/urls';

type ExploreSectionsProps = {
  sections: DirectorySection[];
  followed: Set<string>;
  bottomPadding: number;
  /** The drawer has finished rising. */
  ready: boolean;
  onOpen: (blog: DirectoryBlog) => void;
};

const sectionKey = (section: DirectorySection) => section.id;
/** The shelves the page opens on. */
const FIRST_SHELVES = 3;
const blogKey = (blog: DirectoryBlog) => blog.feedUrl;

/**
 * The directory, a row per section, with where the posts come from at the
 * foot. A FlashList of sections, each a horizontal FlashList of tiles, as on
 * the other Explores, so only what is near the screen is built.
 */
export const ExploreSections = React.memo(function ExploreSections({ sections, followed, bottomPadding, ready, onOpen }: ExploreSectionsProps) {
  const byFeed = React.useMemo(() => new Map(sections.flatMap((s) => s.blogs.map((b) => [b.feedUrl, b] as const))), [sections]);
  const openFeed = React.useCallback(
    (feedUrl: string) => {
      const blog = byFeed.get(feedUrl);
      if (blog) onOpen(blog);
    },
    [byFeed, onOpen],
  );
  const renderTile = React.useCallback(
    (blog: DirectoryBlog) => (
      <BlogTile
        id={blog.feedUrl}
        title={blog.title}
        author={hostOf(blog.feedUrl)}
        artworkUrl={blog.imageUrl ?? null}
        following={followed.has(blog.feedUrl)}
        width={SHELF_TILE_WIDTH}
        onPress={openFeed}
      />
    ),
    [followed, openFeed],
  );
  const renderShelf = React.useCallback(
    (section: DirectorySection) => (
      <ShelfSection title={section.label}>
        <ShelfRow items={section.blogs} keyOf={blogKey} renderTile={renderTile} extraData={followed} />
      </ShelfSection>
    ),
    [followed, renderTile],
  );

  return (
    <ShelfStack
      shelves={sections}
      keyOf={sectionKey}
      renderShelf={renderShelf}
      first={FIRST_SHELVES}
      ready={ready}
      bottomPadding={bottomPadding}
      footer={<BlogsNotice />}
    />
  );
});
