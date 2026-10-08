import { describe, expect, it } from 'vitest';

import { changesKept, DAY, isKeptCatalogue, isKeptKey } from '@/lib/query-persist-policy';

const NOW = 1_800_000_000_000;
const answer = (queryKey: readonly unknown[], data: unknown, age = 0) => ({
  queryKey,
  state: { data, dataUpdatedAt: NOW - age },
});

describe('isKeptKey', () => {
  it('keeps what the Explore pages are drawn from', () => {
    expect(isKeptKey(['discovery', 'chart', 'all', 50])).toBe(true);
    expect(isKeptKey(['gutenberg', 'shelf-preview', 'popular'])).toBe(true);
  });

  it('leaves out searches, paged shelves, book pages and the library', () => {
    expect(isKeptKey(['discovery', 'search', 'history'])).toBe(false);
    expect(isKeptKey(['gutenberg', 'shelf', 'popular'])).toBe(false);
    expect(isKeptKey(['gutenberg', 'book', 7213])).toBe(false);
    expect(isKeptKey(['podcasts', 'library', 'shows'])).toBe(false);
    expect(isKeptKey([])).toBe(false);
  });
});

describe('isKeptCatalogue', () => {
  it('keeps a catalogue that has an answer', () => {
    expect(isKeptCatalogue(answer(['discovery', 'chart', 1482, 50], []), NOW)).toBe(true);
  });

  it('skips one still waiting for its first answer', () => {
    expect(isKeptCatalogue(answer(['discovery', 'chart', 1482, 50], undefined), NOW)).toBe(false);
  });

  it('skips an answer too old to be read back', () => {
    expect(isKeptCatalogue(answer(['discovery', 'chart', 1482, 50], [], DAY - 1), NOW)).toBe(true);
    expect(isKeptCatalogue(answer(['discovery', 'chart', 1482, 50], [], DAY), NOW)).toBe(false);
  });

  it('skips everything that is not a catalogue', () => {
    expect(isKeptCatalogue(answer(['podcasts', 'library', 'shows'], []), NOW)).toBe(false);
  });
});

describe('changesKept', () => {
  const chart = { queryKey: ['discovery', 'chart', 'all', 50] };
  const library = { queryKey: ['podcasts', 'library', 'shows'] };

  it('is a kept catalogue taking a new answer, or being dropped', () => {
    expect(changesKept({ type: 'updated', query: chart, action: { type: 'success' } })).toBe(true);
    expect(changesKept({ type: 'removed', query: chart })).toBe(true);
  });

  it('is not a fetch starting, failing, or a query being made', () => {
    expect(changesKept({ type: 'updated', query: chart, action: { type: 'fetch' } })).toBe(false);
    expect(changesKept({ type: 'updated', query: chart, action: { type: 'error' } })).toBe(false);
    expect(changesKept({ type: 'added', query: chart })).toBe(false);
    expect(changesKept({ type: 'observerResultsUpdated', query: chart })).toBe(false);
  });

  it('is never anything the library does', () => {
    expect(changesKept({ type: 'updated', query: library, action: { type: 'success' } })).toBe(false);
    expect(changesKept({ type: 'removed', query: library })).toBe(false);
  });
});
