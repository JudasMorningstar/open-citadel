import { queryClient } from '@/lib/query-client';
import { blogKeys } from '@/query-manager/blogs/keys';

/**
 * The blog library changed: re-read whatever is on screen, and mark the rest
 * to be read again when next shown. For services and hooks alike.
 */
export function invalidateBlogLibrary(): void {
  void queryClient.invalidateQueries({ queryKey: blogKeys.library() });
}
