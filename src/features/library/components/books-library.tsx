import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LibrarySkeleton } from '@/components/skeletons/library-skeleton';
import { ThemedView } from '@/components/themed-view';
import { fabClearance } from '@/components/fab-placement';
import { layout } from '@/constants/theme';
import { AddBooksFab } from '@/features/library/components/add-books-fab';
import { BookSheets } from '@/features/library/components/book-sheets';
import { BookShelves } from '@/features/library/components/book-shelves';
import { BooksWelcome } from '@/features/library/components/books-welcome';
import { NewCollectionPrompt } from '@/features/library/components/new-collection-prompt';
import { PullToSync } from '@/components/pull-to-sync';
import { SyncIndicator } from '@/features/library/components/sync-indicator';
import type { BookSheetsState } from '@/features/library/hooks/use-book-sheets';
import type { BooksLibraryState } from '@/features/library/hooks/use-books-library';
import type { NewCollectionState } from '@/features/library/hooks/use-new-collection';

/** The book scan's own indicator, which follows the scan's progress itself. */
const renderSyncIndicator = (label: string | undefined) => <SyncIndicator label={label} />;

type BooksLibraryProps = {
  library: BooksLibraryState;
  sheets: BookSheetsState;
  newCollection: NewCollectionState;
  /** Room kept free at the bottom for the mini player, when one is showing. */
  bottomChrome: number;
};

/**
 * The books side of the Library: the boot skeleton, the getting-started page, or the
 * shelves with their sheets. The header above it and the switch to podcasts
 * belong to `LibraryPage`, and `BooksPage` wires the state in.
 */
export function BooksLibrary({ library, sheets, newCollection, bottomChrome }: BooksLibraryProps) {
  const insets = useSafeAreaInsets();
  const scrollBottom = layout.scrollBottom + bottomChrome + fabClearance(insets.bottom);

  // Boot in progress: the shape of the Library rather than either branch, so
  // neither the setup prompt nor an empty scaffold can flash. A skeleton and
  // not a spinner: this is the first screen anyone sees, and it should arrive
  // as the page filling in.
  if (library.view === 'booting') {
    return (
      <ThemedView className="flex-1">
        <LibrarySkeleton />
      </ThemedView>
    );
  }
  if (library.view === 'setup') {
    return (
      <ThemedView className="flex-1">
        <BooksWelcome
          bottomPadding={bottomChrome + insets.bottom + layout.gutter}
          onAddBooks={library.setUp}
          onFreeBooks={library.openFreeBooks}
        />
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1">
      {/* Pull down at the top to scan, and the gap it opens is where every
          scan reports itself, the launch scan and All Books' button included.
          It carries the page's scroll fade. */}
      <PullToSync
        running={library.syncRunning}
        onSync={library.pullSync}
        renderIndicator={renderSyncIndicator}
        contentContainerClassName="pt-6"
        contentContainerStyle={{ paddingBottom: scrollBottom }}
      >
        <BookShelves
          shelves={library.shelves}
          collections={library.collections}
          viewAll={library.viewAll}
          onOpen={library.openReader}
          onMenu={sheets.openMenu}
          onOpenCollection={library.openCollection}
          onNewCollection={newCollection.open}
        />
      </PullToSync>

      {/* The page's one creative action, the same floating button the
          Timeline gives its own: adding books, from Files or for free. */}
      <AddBooksFab options={library.addOptions} onSelect={library.onAddBooks} />

      <BookSheets sheets={sheets} />
      <NewCollectionPrompt {...newCollection.prompt} />
    </ThemedView>
  );
}
