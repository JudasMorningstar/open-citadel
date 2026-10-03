import { describe, expect, it } from 'vitest';

import { keepUnchanged } from '@/utils/keep-unchanged';

describe('keepUnchanged', () => {
  const held = [
    { id: 'a', title: 'Meditations', status: 'reading' },
    { id: 'b', title: 'Walden', status: null },
  ];

  it('hands back the held list when a reload reads the same rows', () => {
    const reread = held.map((row) => ({ ...row }));
    expect(keepUnchanged(held, reread)).toBe(held);
  });

  it('keeps the rows that did not change and replaces the one that did', () => {
    const reread = [{ ...held[0] }, { ...held[1], status: 'queued' }];
    const next = keepUnchanged(held, reread);
    expect(next).not.toBe(held);
    expect(next[0]).toBe(held[0]);
    expect(next[1]).toEqual({ id: 'b', title: 'Walden', status: 'queued' });
  });

  it('keeps an unchanged record of progress', () => {
    const progress = { a: 0.4, b: 0.9 };
    expect(keepUnchanged(progress, { a: 0.4, b: 0.9 })).toBe(progress);
    expect(keepUnchanged(progress, { a: 0.5, b: 0.9 })).toEqual({ a: 0.5, b: 0.9 });
  });

  it('takes a list with a row added', () => {
    const next = keepUnchanged(held, [...held.map((row) => ({ ...row })), { id: 'c', title: 'Emma', status: null }]);
    expect(next).toHaveLength(3);
    expect(next[0]).toBe(held[0]);
  });
});
