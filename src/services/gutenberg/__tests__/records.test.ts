import { describe, expect, it } from 'vitest';

import { canDownload, catalogListPath, epubFileName, gutenbergIdFromUri } from '@/services/gutenberg/records';

describe('canDownload', () => {
  const epubUrl = 'https://www.gutenberg.org/ebooks/1342.epub3.images';

  it('allows a public-domain book with an EPUB', () => {
    expect(canDownload({ publicDomain: true, epubUrl })).toBe(true);
  });

  it('refuses a book still under copyright, one the catalogue says nothing about, or one with no EPUB', () => {
    expect(canDownload({ publicDomain: false, epubUrl })).toBe(false);
    expect(canDownload({ publicDomain: null, epubUrl })).toBe(false);
    expect(canDownload({ publicDomain: true, epubUrl: null })).toBe(false);
  });
});

describe('catalogListPath', () => {
  it('asks for a shelf by its topic, encoded', () => {
    expect(catalogListPath({ topic: 'Category: Philosophy & Ethics', page: 2 })).toBe(
      '/books?page=2&topic=Category%3A%20Philosophy%20%26%20Ethics',
    );
  });

  it('asks for a search, or the newest, leaving out what was not asked', () => {
    expect(catalogListPath({ search: 'marcus aurelius', page: 1 })).toBe('/books?page=1&search=marcus%20aurelius');
    expect(catalogListPath({ sort: 'newest', page: 1 })).toBe('/books?page=1&sort=newest');
  });
});

describe('library files', () => {
  it('names a download so it can be recognised later', () => {
    const name = epubFileName('Moby Dick; Or, The Whale', 2701);
    expect(name).toBe('Moby_Dick_Or_The_Whale-pg2701.epub');
    expect(gutenbergIdFromUri(`file:///data/OpenCitadel/${name}`)).toBe(2701);
  });

  it('recognises a download in an Android folder, renamed or not', () => {
    const base = 'content://com.android.externalstorage.documents/tree/primary%3ABooks/document/primary%3ABooks%2FOpen%20Citadel%2F';
    expect(gutenbergIdFromUri(`${base}Emma-pg158.epub`)).toBe(158);
    expect(gutenbergIdFromUri(`${base}Emma-pg158%20(1).epub`)).toBe(158);
  });

  it('ignores a book that did not come from here', () => {
    expect(gutenbergIdFromUri('file:///data/OpenCitadel/my-book.epub')).toBeNull();
    expect(gutenbergIdFromUri(null)).toBeNull();
  });
});
