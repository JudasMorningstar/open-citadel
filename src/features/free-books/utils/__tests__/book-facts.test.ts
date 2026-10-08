import { describe, expect, it } from 'vitest';

import { bookFacts } from '@/features/free-books/utils/book-facts';

describe('bookFacts', () => {
  it('names the language, the downloads and the rights', () => {
    expect(bookFacts({ language: 'en', downloads: 185596, publicDomain: true })).toEqual([
      { label: 'Language', value: 'English' },
      { label: 'Downloads, last 30 days', value: '185,596' },
      { label: 'Rights', value: 'Public domain in the USA' },
    ]);
  });

  it('says when a book is still under copyright', () => {
    expect(bookFacts({ language: null, downloads: null, publicDomain: false })).toEqual([
      { label: 'Rights', value: 'Still under copyright' },
    ]);
  });

  it('leaves out what the catalogue did not give', () => {
    expect(bookFacts({ language: null, downloads: null, publicDomain: null })).toEqual([]);
  });
});
