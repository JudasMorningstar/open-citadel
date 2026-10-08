import { describe, expect, it } from 'vitest';

import { changed, presentShowColumns, type StoredForMerge } from '@/services/podcasts/feed-columns';
import type { ParsedEpisode, ParsedFeed } from '@/services/podcasts/feed-parser';

const feed = (patch: Partial<ParsedFeed>): ParsedFeed => ({
  type: 'rss',
  title: 'Show',
  author: 'Host',
  description: null,
  link: null,
  imageUrl: 'https://img.test/a.jpg',
  language: null,
  fundingUrl: null,
  feedIdentifier: null,
  episodes: [],
  ...patch,
});

const episode = (patch: Partial<ParsedEpisode>): ParsedEpisode => ({
  guid: 'g1',
  title: 'One',
  description: 'Notes',
  link: null,
  pubDate: '2026-01-01T00:00:00.000Z',
  imageUrl: null,
  audioUrl: 'https://a.test/1.mp3',
  mimeType: 'audio/mpeg',
  durationSec: 600,
  fileSize: null,
  chaptersUrl: null,
  transcriptUrl: null,
  transcriptType: null,
  chapters: [],
  ...patch,
});

const stored: StoredForMerge = {
  id: 'e1',
  guid: 'g1',
  audioUrl: 'https://a.test/1.mp3',
  title: 'One',
  pubDate: '2026-01-01T00:00:00.000Z',
  durationSec: 600,
  mimeType: 'audio/mpeg',
  imageUrl: null,
  fileSize: null,
  chaptersUrl: null,
  notesLength: 5,
};

describe('presentShowColumns', () => {
  it('leaves out what this fetch did not say, so it cannot wipe what was stored', () => {
    const columns = presentShowColumns(feed({ imageUrl: null, author: null }));
    expect(columns).not.toHaveProperty('imageUrl');
    expect(columns).not.toHaveProperty('author');
    expect(columns.title).toBe('Show');
  });
});

describe('changed', () => {
  it('is false when the publisher changed nothing', () => {
    expect(changed(stored, episode({}))).toBe(false);
  });

  it('notices a new title, a moved file or rewritten notes', () => {
    expect(changed(stored, episode({ title: 'One (remastered)' }))).toBe(true);
    expect(changed(stored, episode({ audioUrl: 'https://cdn.test/1.mp3' }))).toBe(true);
    expect(changed(stored, episode({ description: 'Longer notes' }))).toBe(true);
  });

  it('ignores a feed that stopped saying how long the episode is', () => {
    expect(changed(stored, episode({ durationSec: 0 }))).toBe(false);
  });
});
