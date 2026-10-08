import type { DiscoveredShow } from '@/services/podcasts/discovery';
import { showName, type ShowItem } from '@/services/podcasts/records';

/** What a show tile draws, whether the show is followed or was found in Explore. */
export type ShowTileData = {
  id: string;
  title: string;
  author: string | null;
  artworkUrl: string | null;
  newCount?: number;
  following?: boolean;
};

/** A followed show's tile: its own name for it, and how many new episodes wait. */
export function tileFromShow(show: ShowItem): ShowTileData {
  return { id: show.id, title: showName(show), author: show.author, artworkUrl: show.imageUrl, newCount: show.newCount };
}

/** A chart or search result's key: Apple's id, or its title where Apple gave none. */
export function discoveredKey(show: DiscoveredShow): string {
  return show.appleId ?? show.feedUrl ?? show.title;
}

/** A show found in Explore, marked if it is already followed. */
export function tileFromDiscovered(show: DiscoveredShow, following: boolean): ShowTileData {
  return { id: discoveredKey(show), title: show.title, author: show.author, artworkUrl: show.artworkUrl, following };
}
