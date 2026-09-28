import { describe, expect, it } from 'vitest';

import { monogramOf } from '@/utils/monogram';

describe('monogramOf', () => {
  it('takes the first two meaningful words', () => {
    expect(monogramOf('Farnam Street')).toBe('FS');
    expect(monogramOf('The Marginalian')).toBe('M');
    expect(monogramOf('A Wealth of Common Sense')).toBe('WC');
    expect(monogramOf('1000-Word Philosophy')).toBe('1W');
    expect(monogramOf("The Philosophers' Magazine")).toBe('PM');
  });

  it('keeps small words when there is nothing else, and never returns nothing', () => {
    expect(monogramOf('The')).toBe('T');
    expect(monogramOf('   ')).toBe('?');
  });
});
