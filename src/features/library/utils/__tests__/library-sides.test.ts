import { describe, expect, it } from 'vitest';

import { booksLibraryView, sideSettleMs, SWITCH_SETTLE_MS } from '@/features/library/utils/library-sides';

describe('sideSettleMs', () => {
  it('does not make the side the app opened on wait', () => {
    expect(sideSettleMs('blogs', 'blogs')).toBe(0);
  });

  it('waits the switch out for a side opened through it', () => {
    expect(sideSettleMs('books', 'blogs')).toBe(SWITCH_SETTLE_MS);
    expect(sideSettleMs('podcasts', 'blogs')).toBe(SWITCH_SETTLE_MS);
  });
});

describe('booksLibraryView', () => {
  it('holds the skeleton until the library has been read', () => {
    expect(booksLibraryView({ booted: false, landed: true, needsSetup: true })).toBe('booting');
  });

  it('holds the skeleton while the side is still moving', () => {
    expect(booksLibraryView({ booted: true, landed: false, needsSetup: false })).toBe('booting');
  });

  it('asks for setup only once it knows there is nothing', () => {
    expect(booksLibraryView({ booted: true, landed: true, needsSetup: true })).toBe('setup');
  });

  it('shows the shelves otherwise', () => {
    expect(booksLibraryView({ booted: true, landed: true, needsSetup: false })).toBe('library');
  });
});
