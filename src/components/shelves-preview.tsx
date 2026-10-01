import React from 'react';
import { ScrollView } from 'react-native';

import { PageFade, RowFade } from '@/components/scroll-fades';
import { SHELF_ROW_PADDING, ShelfGap } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';

export type PreviewShelf = {
  key: string;
  title: string;
  /** Left off where the real shelf has no VIEW ALL. */
  onViewAll?: () => void;
  tiles: React.ReactElement[];
};

/**
 * An Explore page's first screen, drawn as plain views from what the cache
 * already holds, to stand in for the page while it slides in.
 *
 * The real page is a list of lists, and building one mid-slide is what made
 * the drawers stagger, so it waits for the slide to land under a placeholder
 * (`Handover`). A skeleton there meant every visit looked like a first one,
 * cache or not. When the cache has the first shelves this is the placeholder
 * instead: a few shelves of a few tiles, about what the skeleton cost, laid
 * out exactly as the list lays out its own (same padding, gaps and fades), so
 * the list taking its place underneath cannot be seen.
 */
export function ShelvesPreview({ shelves }: { shelves: PreviewShelf[] }) {
  return (
    <PageFade>
      <ScrollView scrollEnabled={false} contentContainerClassName="pt-4" showsVerticalScrollIndicator={false}>
        {shelves.map((shelf) => (
          <ShelfSection key={shelf.key} title={shelf.title} onViewAll={shelf.onViewAll}>
            <RowFade>
              <ScrollView horizontal scrollEnabled={false} contentContainerStyle={SHELF_ROW_PADDING} showsHorizontalScrollIndicator={false}>
                {shelf.tiles.map((tile, i) => (
                  <React.Fragment key={tile.key ?? i}>
                    {i > 0 ? <ShelfGap /> : null}
                    {tile}
                  </React.Fragment>
                ))}
              </ScrollView>
            </RowFade>
          </ShelfSection>
        ))}
      </ScrollView>
    </PageFade>
  );
}
