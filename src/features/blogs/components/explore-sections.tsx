import React from 'react';

import { TransitionFlashList } from '@/components/navigation/transition-scroll';
import { PageFade } from '@/components/scroll-fades';
import { ShelfRow } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';
import { LIST_DRAW_DISTANCE, SHELF_TILE_WIDTH } from '@/constants/theme';
import { BlogsNotice } from '@/features/blogs/components/blogs-notice';
import { BlogTile } from '@/features/blogs/components/blog-tile';
import type { DirectoryBlog, DirectorySection } from '@/services/blogs/directory';
import { hostOf } from '@/utils/urls';

type ExploreSectionsProps = {
  sections: DirectorySection[];
  followed: Set<string>;
  bottomPadding: number;
  onOpen: (blog: DirectoryBlog) => void;
};

const sectionKey = (section: DirectorySection) => section.id;
const blogKey = (blog: DirectoryBlog) => blog.feedUrl;

/**
 * The directory, a row per section, with where the posts come from at the
 * foot. A FlashList of sections, each a horizontal FlashList of tiles, as on
 * the other Explores, so only what is near the screen is built.
 */
export function ExploreSections({ sections, followed, bottomPadding, onOpen }: ExploreSectionsProps) {
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
  const renderItem = React.useCallback(
    ({ item }: { item: DirectorySection }) => (
      <ShelfSection title={item.label}>
        <ShelfRow items={item.blogs} keyOf={blogKey} renderTile={renderTile} extraData={followed} />
      </ShelfSection>
    ),
    [followed, renderTile],
  );

  return (
    <PageFade>
      <TransitionFlashList
        data={sections}
        keyExtractor={sectionKey}
        renderItem={renderItem}
        extraData={followed}
        drawDistance={LIST_DRAW_DISTANCE}
        contentContainerClassName="pt-4"
        contentContainerStyle={{ paddingBottom: bottomPadding }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<BlogsNotice />}
      />
    </PageFade>
  );
}
