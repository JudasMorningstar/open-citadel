import { queryClient } from '@/lib/query-client';
import { podcastKeys } from '@/query-manager/podcasts/keys';

/**
 * The library changed: re-read whatever is on screen, and mark the rest to be
 * read again when next shown. For services, outside React.
 *
 * Deliberately not called for the player's periodic position saves. Those land
 * every few seconds for as long as something plays, and re-reading every
 * shelf on each one would re-render the Library at that rate for a progress
 * bar the player already draws live.
 */
export function invalidatePodcastLibrary(): void {
  void queryClient.invalidateQueries({ queryKey: podcastKeys.library() });
}

