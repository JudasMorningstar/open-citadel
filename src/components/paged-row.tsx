import React from 'react';
import { ScrollView, View } from 'react-native';

import { RowFade } from '@/components/scroll-fades';
import { contentColumn } from '@/constants/theme';
import { usePager } from '@/hooks/use-pager';
import { cn } from '@/lib/cn';

type PagedRowProps<T> = {
  items: T[];
  keyOf: (item: T) => string;
  renderPage: (item: T) => React.ReactNode;
};

/**
 * What someone is part-way through, a page each: Currently Reading on the
 * books side, Continue Listening on the podcasts side.
 *
 * Pages are full-window width, because the paging math owns that width; the
 * card inside each is what gets capped to the content column. Dots underneath
 * when there is more than one page.
 */
export function PagedRow<T>({ items, keyOf, renderPage }: PagedRowProps<T>) {
  // Destructured: the ref is handed to the ScrollView, never read in render.
  const { ref, width, page, onSettle } = usePager(items.length);
  const pageStyle = { width };

  return (
    <View className="gap-4">
      <RowFade>
        <ScrollView
          ref={ref}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onSettle}
        >
          {items.map((item) => (
            <View key={keyOf(item)} className="px-6" style={pageStyle}>
              <View style={contentColumn}>{renderPage(item)}</View>
            </View>
          ))}
        </ScrollView>
      </RowFade>
      {items.length > 1 ? <PagerDots count={items.length} page={page} /> : null}
    </View>
  );
}

/** Where the pager is: one mark per page, the current one long and gold. */
function PagerDots({ count, page }: { count: number; page: number }) {
  const marks = Array.from({ length: count }, (_, i) => i);
  return (
    <View className="flex-row justify-center gap-2 pt-2">
      {marks.map((i) => (
        <View key={i} className={cn('h-1.5 w-1.5 bg-surface-tertiary', i === page && 'w-4 bg-primary')} />
      ))}
    </View>
  );
}
