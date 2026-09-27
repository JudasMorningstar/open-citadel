import { describe, expect, it } from 'vitest';

import { gutendexListParams, toCatalogBook, toCatalogDetail } from '../gutenberg-catalog.js';
import type { GutendexBook } from '../gutendex.js';

// As Gutendex returns it, trimmed.
const PRIDE: GutendexBook = {
  id: 1342,
  title: 'Pride and Prejudice',
  authors: [{ name: 'Austen, Jane' }],
  summaries: ['"Pride and Prejudice" by Jane Austen is a novel published in 1813.'],
  subjects: ['Courtship -- Fiction', 'Love stories'],
  bookshelves: ['Category: Classics of Literature'],
  languages: ['en'],
  copyright: false,
  download_count: 198164,
  formats: {
    'text/html': 'https://www.gutenberg.org/ebooks/1342.html.images',
    'application/epub+zip': 'https://www.gutenberg.org/ebooks/1342.epub3.images',
    'image/jpeg': 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg',
  },
};

describe('gutendexListParams', () => {
  it('always asks for English, public-domain books with an EPUB', () => {
    const params = gutendexListParams({ sort: 'popular', page: 1 });
    expect(params).toContain('languages=en');
    expect(params).toContain('copyright=false');
    expect(params).toContain('mime_type=application%2Fepub%2Bzip');
  });

  it('encodes what the caller sent, so it stays a value', () => {
    const params = gutendexListParams({ topic: 'Category: Poetry&ids=1', sort: 'popular', page: 2 });
    expect(params).toContain('topic=Category%3A%20Poetry%26ids%3D1');
    expect(params).toContain('page=2');
    expect(params).not.toContain('&ids=1');
  });

  it('orders newest first by eBook number', () => {
    expect(gutendexListParams({ sort: 'newest', page: 1 })).toContain('sort=descending');
    expect(gutendexListParams({ sort: 'popular', page: 1 })).not.toContain('sort=');
  });
});

describe('toCatalogBook', () => {
  it('says the author the way people say names, with the cover', () => {
    expect(toCatalogBook(PRIDE)).toEqual({
      id: 1342,
      title: 'Pride and Prejudice',
      author: 'Jane Austen',
      coverUrl: 'https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg',
    });
  });

  it('drops a record with no number or title', () => {
    expect(toCatalogBook({ ...PRIDE, id: 'x' })).toBeNull();
    expect(toCatalogBook({ ...PRIDE, title: ' ' })).toBeNull();
  });
});

describe('toCatalogDetail', () => {
  it('carries the summary, rights and file', () => {
    expect(toCatalogDetail(PRIDE)).toMatchObject({
      summary: '"Pride and Prejudice" by Jane Austen is a novel published in 1813.',
      language: 'en',
      downloads: 198164,
      subjects: ['Courtship -- Fiction', 'Love stories'],
      publicDomain: true,
      epubUrl: 'https://www.gutenberg.org/ebooks/1342.epub3.images',
    });
  });

  it('marks a book still under copyright, and one the catalogue says nothing about', () => {
    expect(toCatalogDetail({ ...PRIDE, copyright: true })?.publicDomain).toBe(false);
    expect(toCatalogDetail({ ...PRIDE, copyright: null })?.publicDomain).toBeNull();
  });

  it('never hands the device a file from anywhere but gutenberg.org', () => {
    const elsewhere = { ...PRIDE, formats: { 'application/epub+zip': 'https://example.com/book.epub' } };
    expect(toCatalogDetail(elsewhere)?.epubUrl).toBeNull();
  });
});
