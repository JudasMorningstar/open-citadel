import React from 'react';
import { View } from 'react-native';

import { StillRowFade } from '@/components/scroll-fades';
import { SHELF_ROW_PADDING, ShelfGap } from '@/components/shelf-row';
import { ShelfSection } from '@/components/shelf-section';

export type PreviewShelf = {
  key: string;
  title: string;
  /** Left off where the real shelf has no VIEW ALL. */
  onViewAll?: () => void;
  tiles: React.ReactElement[];
};

/** The page's box: whatever of the last shelf does not fit is cut off, as a list's would be. */
const PAGE = { flex: 1, overflow: 'hidden' } as const;
/** A shelf's row, laid out as its list lays its tiles out, and cut at the edge the same way. */
const ROW = { flexDirection: 'row', overflow: 'hidden' } as const;

/**
 * An Explore page's first screen, drawn as plain views from what the cache
 * already holds, to stand in for the page while it slides in.
 *
 * The real page is a list of lists, and building one mid-slide is what made
 * the drawers stagger, so it waits for the slide to land under a placeholder
 * (`Handover`). A skeleton there meant every visit looked like a first one,
 * cache or not. When the cache has the first shelves this is the placeholder
 * instead: a few shelves of a few tiles, laid out exactly as the list lays
 * out its own (same padding, gaps and fades), so the list taking its place
 * underneath cannot be seen.
 *
 * Plain views and nothing else, because all of this is built before the
 * drawer can start to rise. It was scroll views inside the app's scroll
 * fades, with scrolling switched off: four scroll views, their scroll
 * handlers and seven animated fades for a picture that never moves, and
 * the reason a page seen before opened later than one seen for the first
 * time. A list at rest shows only its trailing fade, which `StillRowFade`
 * draws.
 */
export function ShelvesPreview({ shelves }: { shelves: PreviewShelf[] }) {
  return (
    <View style={PAGE} className="pt-4">
      {shelves.map((shelf) => (
        <ShelfSection key={shelf.key} title={shelf.title} onViewAll={shelf.onViewAll}>
          <StillRowFade>
            <View style={[ROW, SHELF_ROW_PADDING]}>
              {shelf.tiles.map((tile, i) => (
                <React.Fragment key={tile.key ?? i}>
                  {i > 0 ? <ShelfGap /> : null}
                  {tile}
                </React.Fragment>
              ))}
            </View>
          </StillRowFade>
        </ShelfSection>
      ))}
    </View>
  );
}
