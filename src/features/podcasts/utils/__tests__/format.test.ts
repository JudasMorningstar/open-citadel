import { describe, expect, it } from 'vitest';

import {
  formatClock,
  formatDuration,
  formatPubDate,
  playLabel,
} from '@/features/podcasts/utils/format';

describe('format', () => {
  it('writes clocks', () => {
    expect(formatClock(75)).toBe('1:15');
    expect(formatClock(3723)).toBe('1:02:03');
  });

  it('writes durations the way people say them', () => {
    expect(formatDuration(3900)).toBe('1 hr 5 min');
    expect(formatDuration(3600)).toBe('1 hr');
    expect(formatDuration(20)).toBe('1 min');
    expect(formatDuration(0)).toBe('');
  });

  it('says what is left once started', () => {
    expect(playLabel({ positionSec: 600, durationSec: 1800, playState: 'unplayed' })).toBe('20 min left');
    expect(playLabel({ positionSec: 0, durationSec: 1800, playState: 'new' })).toBe('30 min');
    expect(playLabel({ positionSec: 0, durationSec: 1800, playState: 'played' })).toBe('Played');
  });

  it('writes relative dates', () => {
    const now = new Date(2026, 8, 26, 12);
    expect(formatPubDate(new Date(2026, 8, 26, 3).toISOString(), now)).toBe('Today');
    expect(formatPubDate(new Date(2026, 8, 25, 23).toISOString(), now)).toBe('Yesterday');
    expect(formatPubDate(null, now)).toBe('');
  });
});
