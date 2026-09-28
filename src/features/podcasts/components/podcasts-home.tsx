import React from 'react';

import { PagedRow } from '@/components/paged-row';
import { PullToSync } from '@/components/pull-to-sync';
import { ShelfSection } from '@/components/shelf-section';
import { layout, revealIn } from '@/constants/theme';
import { ContinueCard } from '@/features/podcasts/components/continue-card';
import { EpisodeShelf } from '@/features/podcasts/components/episode-shelf';
import { NEW_EPISODES_PULL_LABELS, renderNewEpisodesIndicator } from '@/features/podcasts/components/new-episodes-indicator';
import { ShowShelf } from '@/features/podcasts/components/show-shelf';
import type { PodcastHome } from '@/features/podcasts/hooks/use-podcast-home';
import { KEPT_SHELVES, LEAD_SHELVES, SECTION_TITLES, type ListedShelf, type PodcastSection } from '@/features/podcasts/utils/sections';
import type { EpisodeItem } from '@/services/podcasts/records';

type PodcastsHomeProps = {
  home: PodcastHome;
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

/**
 * The podcasts side of the Library, laid out the way the books side is: a
 * paged hero for what is in progress, then shelves, each with a "View all".
 *
 * Sections only appear when they have something in them, like the books
 * side's, so a new listener sees two shelves rather than seven empty ones.
 */
export function PodcastsHome({
  home,
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
  // The order sections arrive in, for the reveal's stagger.
  const order: PodcastSection[] = [
    ...(shelves.continue.length > 0 ? (['continue'] as const) : []),
    ...lead,
    ...(shows.length > 0 ? (['shows'] as const) : []),
    ...kept,
  ];
  const reveal = (section: PodcastSection) => revealIn(order.indexOf(section));
  const renderContinue = (episode: EpisodeItem) => (
    <ContinueCard episode={episode} onPress={onOpenEpisode} onLongPress={onEpisodeMenu} onPlay={onPlay} />
  );
  const renderShelf = (key: ListedShelf) => (
    <ShelfSection key={key} title={SECTION_TITLES[key]} onViewAll={() => onViewAll(key)} entering={reveal(key)}>
      <EpisodeShelf episodes={shelves[key]} onPress={onOpenEpisode} onLongPress={onEpisodeMenu} onPlay={onPlay} />
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
        {shelves.continue.length > 0 ? (
          <ShelfSection
            title={SECTION_TITLES.continue}
            onViewAll={() => onViewAll('continue')}
            entering={reveal('continue')}
            capped={false}
          >
            <PagedRow items={shelves.continue} keyOf={episodeKey} renderPage={renderContinue} />
          </ShelfSection>
        ) : null}
        {lead.map(renderShelf)}
        {shows.length > 0 ? (
          <ShelfSection title={SECTION_TITLES.shows} onViewAll={() => onViewAll('shows')} entering={reveal('shows')}>
            <ShowShelf shows={shows} onPress={onOpenShow} />
          </ShelfSection>
        ) : null}
        {kept.map(renderShelf)}
    </PullToSync>
  );
}
