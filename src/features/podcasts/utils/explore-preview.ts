import type { ChartState } from '@/features/podcasts/hooks/use-explore';
import { EXPLORE_GENRES } from '@/services/podcasts/discovery';

/** The shelves Explore opens on. */
export const EXPLORE_FIRST_SHELVES = 3;

/**
 * Whether Explore can open on its shelves: whether the charts it opens on are
 * already in hand (cached from an earlier visit). If not it opens on a
 * skeleton and the shelves arrive under it.
 */
export function explorePreviewReady(charts: Record<string, ChartState>): boolean {
  return EXPLORE_GENRES.slice(0, EXPLORE_FIRST_SHELVES).every((genre) => charts[String(genre.id)]?.status === 'ready');
}
