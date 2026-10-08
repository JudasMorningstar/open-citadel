import type { DirectoryBlog } from '@/services/blogs/directory';
import { matchesQuery } from '@/utils/format';

/**
 * Whether what was typed is an address rather than words to search for:
 * a scheme, or a dotted name with no spaces ("fs.blog", "example.com/feed").
 */
export function looksLikeAddress(query: string): boolean {
  const value = query.trim();
  if (!value || /\s/.test(value)) return false;
  if (/^(https?|feed):/i.test(value)) return true;
  return /^[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)+(:\d+)?(\/\S*)?$/u.test(value);
}

/** The directory's blogs that match a search, by name or what they are about. */
export function searchDirectory(blogs: DirectoryBlog[], query: string): DirectoryBlog[] {
  const term = query.trim();
  if (!term) return [];
  return blogs.filter((blog) => matchesQuery(term, blog.title, blog.blurb));
}
