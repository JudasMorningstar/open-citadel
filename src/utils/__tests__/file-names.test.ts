import { describe, expect, it } from 'vitest';

import { safeFileStem } from '@/utils/file-names';

describe('safeFileStem', () => {
  it('keeps what a URL can carry and collapses the rest', () => {
    expect(safeFileStem('Moby Dick; Or, The Whale')).toBe('Moby_Dick_Or_The_Whale');
    expect(safeFileStem('Les Misérables')).toBe('Les_Mise_rables');
  });

  it('cuts to a length when asked', () => {
    expect(safeFileStem('abcdef', 3)).toBe('abc');
  });

  it('never leaves an empty name', () => {
    expect(safeFileStem('日本語')).toBe('book');
  });
});
