import { describe, expect, it } from 'vitest';

import {
  autoDelete,
  autoDownload,
  listenerValuesFrom,
  msToIso,
  newEpisodesAction,
  playState,
  showValuesFrom,
  tags,
} from '@/services/podcasts/antennapod/codes';

describe('AntennaPod codes', () => {
  it('reads read as new, unplayed or played', () => {
    expect(playState(-1)).toBe('new');
    expect(playState(0)).toBe('unplayed');
    expect(playState(1)).toBe('played');
    expect(playState(null)).toBe('unplayed');
  });

  it('reads the per-show switches, defaulting to global', () => {
    expect(autoDownload(0)).toBe('off');
    expect(autoDownload(2)).toBe('on');
    expect(autoDownload(1)).toBe('global');
    expect(autoDownload(undefined)).toBe('global');
    expect(autoDelete(1)).toBe('on');
    expect(autoDelete(2)).toBe('off');
    expect(autoDelete(0)).toBe('global');
  });

  it('reads the new episodes action', () => {
    expect(newEpisodesAction(1)).toBe('inbox');
    expect(newEpisodesAction(3)).toBe('queue');
    expect(newEpisodesAction(2)).toBe('nothing');
    expect(newEpisodesAction(0)).toBe('global');
  });

  it('reads milliseconds as a date, and zero as never', () => {
    expect(msToIso(0)).toBeNull();
    expect(msToIso(Date.UTC(2024, 0, 2))).toBe('2024-01-02T00:00:00.000Z');
  });

  it('splits tags on the record separator and drops AntennaPod’s own', () => {
    expect(tags('#root\u001eHistory\u001e Science ')).toBe(JSON.stringify(['History', 'Science']));
    expect(tags('#root')).toBeNull();
    expect(tags(null)).toBeNull();
  });
});

describe('showValuesFrom', () => {
  const now = '2026-09-26T00:00:00.000Z';

  it('keeps a show’s own settings and drops the feed validator', () => {
    const show = showValuesFrom(
      {
        title: 'Hardcore History',
        custom_title: 'HH',
        state: 2,
        feed_playback_speed: 1.5,
        feed_skip_intro: 30,
        auto_download: 2,
        sort_order: '1',
        keep_updated: 0,
        payment_link: 'https://pay.test\u001fDonate\u001ehttps://other.test',
      },
      true,
      now,
    );
    expect(show).toMatchObject({
      title: 'Hardcore History',
      customTitle: 'HH',
      state: 'archived',
      playbackSpeed: 1.5,
      skipIntroSec: 30,
      autoDownload: 'on',
      episodeSort: 'oldest',
      keepUpdated: 0,
      fundingUrl: 'https://pay.test',
      httpValidator: null,
      lastRefreshAt: null,
    });
  });

  it('treats a missing speed as following everyone’s, and an old backup as followed', () => {
    const show = showValuesFrom({ feed_playback_speed: -1, state: 2 }, false, now);
    expect(show.playbackSpeed).toBeNull();
    expect(show.state).toBe('subscribed');
    expect(show.title).toBe('Untitled podcast');
  });
});

describe('listenerValuesFrom', () => {
  it('converts milliseconds to seconds and marks favourites', () => {
    const values = listenerValuesFrom({ read: 0, position: 90_500, played_duration: 600_000, item_auto_download: 0 }, true);
    expect(values).toMatchObject({
      playState: 'unplayed',
      positionSec: 90.5,
      playedDurationSec: 600,
      isFavorite: 1,
      autoDownloadEligible: 0,
    });
  });
});
