import { appleIdFromLink } from '@/services/podcasts/discovery';

/** Whether what was typed into Explore is a link to open rather than words to search for. */
export function looksLikeLink(query: string): boolean {
  const q = query.trim();
  return /^(https?|feed|pcast|podcast|itpc):/i.test(q) || appleIdFromLink(q) !== null || /^[\w-]+(\.[\w-]+)+\/\S*$/.test(q);
}
