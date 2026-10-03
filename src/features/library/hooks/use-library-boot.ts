import React from 'react';

import { whenIdle } from '@/lib/idle';
import { useSettledFocusEffect } from '@/navigation/use-settled-focus-effect';
import { useBooksStore } from '@/stores/books';
import { useCollectionsStore } from '@/stores/collections';

/** The longest the launch scan is put off for a thread that never goes quiet. */
const SCAN_IDLE_TIMEOUT_MS = 5000;

/**
 * The Library's start: load what is on disk, then look for new books.
 * Returns whether enough has loaded to tell "not set up" from "not loaded
 * yet", which the store's initial empty state cannot.
 *
 * Called by the Library shell, not by the books side, so it runs with the app
 * whichever side the Library opens on.
 */
export function useLibraryBoot(): boolean {
  // The store starts empty (no directory, no books). Until the boot below has
  // loaded it, "no data yet" must not be rendered as "not set up".
  const [booted, setBooted] = React.useState(false);

  React.useEffect(() => {
    const books = useBooksStore.getState();
    const boot = async () => {
      try {
        // iOS: ensure the owned library folder exists and is the scan root.
        if (process.env.EXPO_OS === 'ios') await books.initLibrary();
        await books.loadDirectoryUri();
        // Independent reads of a migrated schema (books never touch
        // collections), so they overlap rather than chain.
        await Promise.all([books.loadBooks(), useCollectionsStore.getState().loadCollections()]);
        await books.hydrateSyncState();
        // Enough state has loaded to decide empty vs configured. Hand off
        // before the launch scan, which flips sync.status to running and
        // shows its own indicator.
        setBooted(true);
        /*
         * The launch scan, on both platforms and announced by a toast.
         *
         * Here rather than in the root layout because this is the hub's
         * initial page and mounts with the app, so "the Library booted" and
         * "the app opened" are the same moment, and because the ordering that
         * matters is the one above it: `hydrateSyncState` has to have picked
         * up a job the last app kill interrupted before the scan can decide it
         * has nothing to add.
         *
         * It used to be iOS-only, on the reasoning that Android books arrive
         * through a folder the user picked rather than through the Files app.
         * That is true of how they get INTO the folder and says nothing about
         * when the app should look at it: a book dropped in from a browser
         * download sat there until the reader went to All Books and pressed a
         * button.
         *
         * Once the thread is idle, not straight after the read: the scan
         * lists the folder, stats every file and writes rows, all on the JS
         * thread, and started here it ran in the same moment the side on
         * screen was mounting its shelves.
         */
        await whenIdle(SCAN_IDLE_TIMEOUT_MS);
        await books.scanOnLaunch();
      } catch (err) {
        console.error('Library boot failed:', err);
        // Never strand the user on the skeleton. The empty state's own gating
        // still applies on top of booted.
        setBooted(true);
      }
    };
    void boot();
  }, []);

  useReloadOnRefocus();
  return booted;
}

/*
 * Reload when the screen is focused AGAIN, so a status change made in the
 * reader (a book moving to "currently reading") is on the shelf when you come
 * back to it.
 *
 * Not on the first focus. That one fires on mount, alongside a boot that has
 * just read both tables, so the launch paid for two full reads and two rounds
 * of re-rendering every shelf to arrive at the same books twice.
 *
 * The skip lives here rather than in a "have I loaded" flag on the store
 * because the duplication is between these two CALLERS, not inside the read.
 * And boot keeps the first load rather than handing it to this: `booted` is
 * what decides between the setup prompt and the library, and it means "the
 * books have been read" only because boot awaited them. Leaving that to a
 * focus callback would make the empty state depend on which effect happened
 * to run first.
 */
function useReloadOnRefocus() {
  // After the screen on top has finished leaving: a reload landing mid-slide
  // re-rendered every shelf and froze the way back.
  useSettledFocusEffect(
    () => {
      void useBooksStore.getState().loadBooks();
      void useCollectionsStore.getState().loadCollections();
    },
    { skipFirst: true },
  );
}
