import { describe, expect, it } from 'vitest';

import { countLabel, formatBytes, matchesQuery } from '@/utils/format';

describe('countLabel', () => {
  it('uses the singular for one and the plural otherwise', () => {
    expect(countLabel(1, 'BOOK')).toBe('1 BOOK');
    expect(countLabel(0, 'BOOK')).toBe('0 BOOKS');
    expect(countLabel(3, 'SHOW')).toBe('3 SHOWS');
  });

  it('takes an irregular plural', () => {
    expect(countLabel(2, 'LIBRARY', 'LIBRARIES')).toBe('2 LIBRARIES');
  });
});

describe('matchesQuery', () => {
  it('matches everything when the query is blank', () => {
    expect(matchesQuery('', 'Dune')).toBe(true);
    expect(matchesQuery('   ', null)).toBe(true);
  });

  it('matches any field, ignoring case and surrounding spaces', () => {
    expect(matchesQuery(' herbert ', 'Dune', 'Frank Herbert')).toBe(true);
    expect(matchesQuery('dune', 'DUNE MESSIAH')).toBe(true);
    expect(matchesQuery('asimov', 'Dune', 'Frank Herbert')).toBe(false);
  });

  it('skips missing fields', () => {
    expect(matchesQuery('x', null, undefined)).toBe(false);
  });
});

describe('formatBytes', () => {
  it('is empty for a missing size', () => {
    expect(formatBytes(null)).toBe('');
    expect(formatBytes(0)).toBe('');
  });

  it('trims a trailing zero', () => {
    expect(formatBytes(1024 ** 3)).toBe('1 GB');
    expect(formatBytes(2.5 * 1024 ** 3)).toBe('2.5 GB');
  });
});
