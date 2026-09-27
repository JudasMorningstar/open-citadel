import { describe, expect, it } from 'vitest';

import { freeBookAction, freeBookActionHint, freeBookActionState } from '@/features/free-books/utils/book-action';

const base = {
  detail: 'ready' as const,
  hasEpub: true,
  downloadable: true,
  inLibrary: false,
  downloading: false,
  downloaded: false,
};

describe('freeBookAction', () => {
  it('offers a public-domain book for download', () => {
    expect(freeBookAction(base)).toBe('download');
  });

  it('reads a book already in the library, whatever else is true', () => {
    expect(freeBookAction({ ...base, inLibrary: true, detail: 'failed' })).toBe('read');
  });

  it('follows a download through to the scan', () => {
    expect(freeBookAction({ ...base, downloading: true })).toBe('downloading');
    expect(freeBookAction({ ...base, downloaded: true })).toBe('adding');
  });

  it('never offers a book still under copyright', () => {
    expect(freeBookAction({ ...base, downloadable: false })).toBe('copyrighted');
  });

  it('waits for the page, and says when there is nothing to fetch', () => {
    expect(freeBookAction({ ...base, detail: 'loading' })).toBe('loading');
    expect(freeBookAction({ ...base, detail: 'failed' })).toBe('unavailable');
    expect(freeBookAction({ ...base, hasEpub: false })).toBe('unavailable');
  });
});

describe('freeBookActionHint', () => {
  it('says where the book goes', () => {
    expect(freeBookActionHint('download', 'ready')).toBe('A free EPUB. It goes into your Open Citadel folder.');
  });

  it('tells a failed load from a book with no EPUB', () => {
    expect(freeBookActionHint('unavailable', 'failed')).toContain('connection');
    expect(freeBookActionHint('unavailable', 'ready')).toContain('no EPUB');
  });

  it('has no copy with an em dash in it', () => {
    const actions = ['download', 'adding', 'read', 'copyrighted', 'unavailable'] as const;
    for (const action of actions) expect(freeBookActionHint(action, 'ready') ?? '').not.toContain('—');
  });
});

describe('freeBookActionState', () => {
  it('is busy and still while a download runs', () => {
    expect(freeBookActionState('downloading')).toEqual({ loading: true, disabled: true });
    expect(freeBookActionState('download')).toEqual({ loading: false, disabled: false });
  });
});
