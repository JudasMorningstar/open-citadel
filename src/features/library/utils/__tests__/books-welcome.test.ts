import { describe, expect, it } from 'vitest';

import { booksWelcomeCopy } from '@/features/library/utils/books-welcome';

describe('booksWelcomeCopy', () => {
  it('picks books on iOS and a folder on Android', () => {
    expect(booksWelcomeCopy('ios').ownTitle).toBe('Add your books');
    expect(booksWelcomeCopy('android').ownTitle).toBe('Choose your books folder');
  });

  it('writes its copy without em dashes', () => {
    for (const platform of ['ios', 'android']) {
      for (const line of Object.values(booksWelcomeCopy(platform))) expect(line).not.toContain('—');
    }
  });
});
