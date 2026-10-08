import React from 'react';

import { EpisodeListControls } from '@/features/podcasts/components/episode-list-controls';
import { ShowHero } from '@/features/podcasts/components/show-hero';
import type { useShowScreen } from '@/features/podcasts/hooks/use-show-screen';

type ShowListHeaderProps = {
  screen: ReturnType<typeof useShowScreen>;
  onUnfollow: () => void;
  onSettings: () => void;
};

/** The head of a show's episode list: the hero, then the list's own controls once the show is stored. */
export function ShowListHeader({ screen, onUnfollow, onSettings }: ShowListHeaderProps) {
  const { show } = screen;
  return (
    <>
      <ShowHero
        {...screen.hero}
        onFollow={screen.follow}
        onUnfollow={onUnfollow}
        onPlayLatest={screen.playLatest}
        onSettings={onSettings}
      />
      {show ? (
        <EpisodeListControls
          count={screen.episodeCount}
          filter={screen.filter}
          sort={show.episodeSort}
          onFilter={screen.setFilter}
          onSort={screen.setSort}
          newCount={screen.newCount}
          onMarkAllSeen={screen.markAllSeen}
        />
      ) : null}
    </>
  );
}
