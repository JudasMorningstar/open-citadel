import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-file-system/legacy', () => ({}));
vi.mock('expo-sqlite', () => ({}));

const { importableFeeds, pick } = await import('@/services/podcasts/antennapod/backup');

describe('importableFeeds', () => {
  it('skips local folders, previews and a second copy of one address, keeping the followed copy', () => {
    const { feeds, skipped } = importableFeeds(
      [
        { id: 1, download_url: 'https://a.test/feed', state: 2 },
        { id: 2, download_url: 'https://a.test/feed', state: 0 },
        { id: 3, download_url: 'antennapod_local:/sdcard/x', state: 0 },
        { id: 4, download_url: 'https://b.test/feed', state: 1 },
        { id: 5, download_url: null, state: 0 },
      ],
      true,
    );
    expect(feeds.map((f) => f.id)).toEqual([2]);
    expect(skipped).toBe(2);
  });

  it('keeps every feed of a backup that predates the state column', () => {
    const { feeds } = importableFeeds([{ id: 1, download_url: 'https://a.test', state: 1 }], false);
    expect(feeds).toHaveLength(1);
  });
});

describe('pick', () => {
  it('selects a column the backup has, and NULL for one it predates', () => {
    const present = new Set(['image_url']);
    expect(pick(present, 'i', 'image_url', 'item_image')).toBe('i.image_url AS item_image');
    expect(pick(present, 'i', 'podcastindex_chapter_url', 'chapters_url')).toBe('NULL AS chapters_url');
  });
});
