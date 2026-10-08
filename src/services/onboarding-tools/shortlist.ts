/**
 * What Samwell was shown, held so the ids he answers with can be resolved.
 *
 * The model is only ever given ids. An id it made up resolves to nothing
 * rather than to a URL this app then fetches, and that is the whole reason
 * these exist.
 *
 * Every search adds to the list rather than replacing it. He is told to search
 * two or three times from different angles and then pick the best of what he
 * saw, and a list that only remembered the last search turned a pick from the
 * first one into "none of those ids came from the search results".
 *
 * Module state, and nothing else here: no I/O, so the approval card can read
 * the names without pulling in the services that do the work.
 */
import type { FreeBookSchema } from 'samwell-shared';
import type { z } from 'zod';

export type Shortlist<T extends { id: number }> = {
  hold: (items: T[]) => void;
  /** The held items for these ids, once each, in the order asked for. */
  pick: (ids: number[]) => T[];
  clear: () => void;
};

export function createShortlist<T extends { id: number }>(): Shortlist<T> {
  const held = new Map<number, T>();
  return {
    hold: (items) => {
      for (const item of items) held.set(item.id, item);
    },
    pick: (ids) =>
      [...new Set(ids)].map((id) => held.get(id)).filter((item): item is T => item !== undefined),
    clear: () => held.clear(),
  };
}

export type FreeBookPick = z.infer<typeof FreeBookSchema> & { epubUrl: string };

/** A show from Apple's directory, keyed on Apple's id. */
export type PodcastPick = {
  id: number;
  title: string;
  author: string | null;
  feedUrl: string;
};

export const freeBookShortlist = createShortlist<FreeBookPick>();
export const podcastShortlist = createShortlist<PodcastPick>();

/**
 * A new conversation starts with nothing held, so an id from an earlier one
 * in the same session cannot be followed or downloaded in this one.
 */
export function clearShortlists(): void {
  freeBookShortlist.clear();
  podcastShortlist.clear();
}
