import React from 'react';

import { Handover } from '@/components/navigation/handover';
import { PagedRow } from '@/components/paged-row';
import { PullToSync } from '@/components/pull-to-sync';
import { ShelfSection } from '@/components/shelf-section';
import { FAVORITE_BADGE, type TileBadgeIcon } from '@/components/tile-badge';
import { layout } from '@/constants/theme';
import { ContinueCard } from '@/features/podcasts/components/continue-card';
import { EpisodeShelf } from '@/features/podcasts/components/episode-shelf';
import { PodcastShelvesSkeleton } from '@/features/podcasts/components/podcast-shelves-skeleton';
import { NEW_EPISODES_PULL_LABELS, renderNewEpisodesIndicator } from '@/features/podcasts/components/new-episodes-indicator';
import { ShowShelf } from '@/features/podcasts/components/show-shelf';
import type { PodcastHome } from '@/features/podcasts/hooks/use-podcast-home';
import { KEPT_SHELVES, LEAD_SHELVES, SECTION_TITLES, type ListedShelf, type PodcastSection } from '@/features/podcasts/utils/sections';
import type { EpisodeItem } from '@/services/podcasts/records';

type PodcastsHomeProps = {
  home: PodcastHome;
  /** The side has finished appearing: the shelves under the Continue card mount. */
  landed: boolean;
  refreshing: boolean;
  bottomPadding: number;
  onRefresh: () => void;
  onViewAll: (section: PodcastSection) => void;
  onOpenEpisode: (episodeId: string) => void;
  onOpenShow: (showId: string) => void;
  onEpisodeMenu: (episode: EpisodeItem) => void;
  onPlay: (episodeId: string) => void;
};

const episodeKey = (episode: EpisodeItem) => episode.id;

/** The mark the books' Favorites shelf carries. */
const SHELF_BADGES: Partial<Record<ListedShelf, TileBadgeIcon>> = { favorites: FAVORITE_BADGE };

/**
 * The podcasts side of the Library, laid out the way the books side is: a
 * paged hero for what is in progress, then shelves, each with a "View all".
 *
 * Sections only appear when they have something in them, like the books
 * side's, so a new listener sees two shelves rather than seven empty ones.
 *
 * The Continue card is one plain card over cached data, so it is drawn with
 * the side as it appears. The shelves are horizontal lists, and wait under
 * their skeleton until the side has landed. They have no entrance of their
 * own: the skeleton fading off them is their arrival, and a fade-in of their
 * own under it left a moment with neither on screen.
 */
export function PodcastsHome({
  home,
  landed,
  refreshing,
  bottomPadding,
  onRefresh,
  onViewAll,
  onOpenEpisode,
  onOpenShow,
  onEpisodeMenu,
  onPlay,
}: PodcastsHomeProps) {
  const { shelves, shows } = home;
  const lead = LEAD_SHELVES.filter((key) => shelves[key].length > 0);
  const kept = KEPT_SHELVES.filter((key) => shelves[key].length > 0);
  const renderContinue = (episode: EpisodeItem) => (
    <ContinueCard episode={episode} onPress={onOpenEpisode} onLongPress={onEpisodeMenu} onPlay={onPlay} />
  );
  const renderShelf = (key: ListedShelf) => (
    <ShelfSection key={key} title={SECTION_TITLES[key]} onViewAll={() => onViewAll(key)}>
      <EpisodeShelf
        episodes={shelves[key]}
        onPress={onOpenEpisode}
        onLongPress={onEpisodeMenu}
        onPlay={onPlay}
        badgeIcon={SHELF_BADGES[key]}
      />
    </ShelfSection>
  );

  return (
    // The Library's own pull: the same gap, the same loader, saying what it
    // does here.
    <PullToSync
      running={refreshing}
      onSync={onRefresh}
      labels={NEW_EPISODES_PULL_LABELS}
      renderIndicator={renderNewEpisodesIndicator}
      contentContainerClassName="pt-6"
      contentContainerStyle={{ paddingBottom: layout.scrollBottom + bottomPadding }}
    >
        {/* No entrance of its own: it arrives with the side. */}
        {shelves.continue.length > 0 ? (
          <ShelfSection title={SECTION_TITLES.continue} onViewAll={() => onViewAll('continue')} capped={false}>
            <PagedRow items={shelves.continue} keyOf={episodeKey} renderPage={renderContinue} />
          </ShelfSection>
        ) : null}
        <Handover fill={false} ready={landed} skeleton={<PodcastShelvesSkeleton />}>
          {lead.map(renderShelf)}
          {shows.length > 0 ? (
            <ShelfSection title={SECTION_TITLES.shows} onViewAll={() => onViewAll('shows')}>
              <ShowShelf shows={shows} onPress={onOpenShow} />
            </ShelfSection>
          ) : null}
          {kept.map(renderShelf)}
        </Handover>
    </PullToSync>
  );
}
