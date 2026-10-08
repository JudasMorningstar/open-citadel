/** The shelves of the Podcasts page, each with a "View all". */
export type PodcastSection = 'continue' | 'queue' | 'inbox' | 'shows' | 'latest' | 'downloads' | 'favorites' | 'history';

export const SECTION_TITLES: Record<PodcastSection, string> = {
  continue: 'Continue Listening',
  queue: 'Up Next',
  // AntennaPod's "Inbox": what has landed and is waiting on the listener.
  inbox: 'Just Arrived',
  shows: 'Shows',
  // AntennaPod's "Episodes": everything recent across the shows followed.
  latest: 'Latest Episodes',
  downloads: 'Downloads',
  favorites: 'Favorites',
  history: 'Recently Played',
};

export function isPodcastSection(value: string | undefined): value is PodcastSection {
  return value != null && value in SECTION_TITLES;
}

/**
 * The home page's episode shelves, in the order a listener reaches for them:
 * what is next and what is new above the shows, what is kept below them.
 */
export const LEAD_SHELVES = ['queue', 'inbox'] as const;
export const KEPT_SHELVES = ['latest', 'downloads', 'favorites', 'history'] as const;
export type ListedShelf = (typeof LEAD_SHELVES)[number] | (typeof KEPT_SHELVES)[number];
