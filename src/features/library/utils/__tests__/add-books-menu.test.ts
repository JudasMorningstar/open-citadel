import { describe, expect, it } from 'vitest';

import { addBooksMenu } from '@/features/library/utils/add-books-menu';

describe('addBooksMenu', () => {
  it('offers Files and the free books on iOS', () => {
    expect(addBooksMenu('ios').map((option) => option.key)).toEqual(['files', 'free']);
  });

  it('offers only the free books on Android, whose books come through its folder', () => {
    expect(addBooksMenu('android').map((option) => option.key)).toEqual(['free']);
  });
});
