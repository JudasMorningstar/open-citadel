import type { BlogSection } from '@/query-manager/blogs';

export const SECTION_TITLES: Record<BlogSection, string> = {
  continue: 'Continue Reading',
  latest: 'Latest Posts',
  queue: 'Queue',
  favorites: 'Favorites',
  finished: 'Have Read',
  blogs: 'Blogs',
};

export function isBlogSection(value: string | undefined): value is BlogSection {
  return value != null && value in SECTION_TITLES;
}
