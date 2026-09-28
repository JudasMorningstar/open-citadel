import { describe, expect, it } from 'vitest';

import { episodeMenu } from '@/features/podcasts/utils/episode-menu';
import type { EpisodeItem } from '@/services/podcasts/records';

const episode = (patch: Partial<EpisodeItem>) =>
  ({
    id: 'e',
    title: 'Episode',
    showTitle: 'Show',
    positionSec: 0,
    playState: 'unplayed',
    queuePosition: null,
    downloadStatus: 'none',
    isFavorite: 0,
    link: null,
    ...patch,
  }) as EpisodeItem;
const keys = (e: EpisodeItem, showLink = true) => episodeMenu(e, { showLink }).map((row) => row.key);

describe('episodeMenu', () => {
  it('offers a fresh episode play, queueing, download, favourite and played', () => {
    expect(keys(episode({}))).toEqual(['play', 'play-next', 'queue-last', 'download', 'favorite', 'played', 'share', 'show']);
  });

  it('says Resume and offers a restart for an episode part-way through', () => {
    const rows = episodeMenu(episode({ positionSec: 120 }), { showLink: false });
    expect(rows[0].label).toBe('Resume');
    expect(rows.map((r) => r.key)).toContain('reset');
  });

  it('offers moving and removing an episode already in Up Next', () => {
    expect(keys(episode({ queuePosition: 2 }))).toEqual(expect.arrayContaining(['play-next', 'queue-last', 'dequeue']));
  });

  it('offers cancelling a download in progress and removing a finished one', () => {
    expect(episodeMenu(episode({ downloadStatus: 'downloading' }), { showLink: true })[3].label).toBe('Cancel download');
    expect(episodeMenu(episode({ downloadStatus: 'downloaded' }), { showLink: true })[3].label).toBe('Remove download');
  });

  it('offers clearing a new episode from New, and unplaying a played one without a restart', () => {
    expect(keys(episode({ playState: 'new' }))).toContain('seen');
    const played = keys(episode({ playState: 'played', positionSec: 50 }));
    expect(played).toContain('unplayed');
    expect(played).not.toContain('reset');
  });

  it('links the website only when there is one, and the show only when asked', () => {
    expect(keys(episode({ link: 'https://x.test' }), false)).toEqual(expect.arrayContaining(['website']));
    expect(keys(episode({}), false)).not.toContain('show');
  });

  it('offers no queueing for the episode in the player, queued or not', () => {
    for (const queuePosition of [null, 0]) {
      const rows = episodeMenu(episode({ queuePosition }), { showLink: true, isCurrent: true }).map((r) => r.key);
      expect(rows).not.toContain('play-next');
      expect(rows).not.toContain('queue-last');
      expect(rows).not.toContain('dequeue');
    }
  });
});
