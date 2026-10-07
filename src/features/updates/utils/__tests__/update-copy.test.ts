import { describe, expect, it } from 'vitest';

import { moreLabel, moreSpoken, updateCopy } from '../update-copy';

describe('updateCopy', () => {
  it('offers only the update while it is ready', () => {
    const copy = updateCopy('ready');
    expect(copy.title).toBe('App update');
    expect(copy.action).toBe('UPDATE NOW');
    expect(copy.wayOut).toBeNull();
  });

  it('says the same while restarting, so nothing jumps under the spinner', () => {
    expect(updateCopy('restarting')).toEqual(updateCopy('ready'));
  });

  it('gives a failed restart a retry and a way out', () => {
    const copy = updateCopy('failed');
    expect(copy.action).toBe('TRY AGAIN');
    expect(copy.wayOut).toBe('NOT NOW');
  });

  it('never uses an em dash', () => {
    for (const phase of ['ready', 'restarting', 'failed'] as const) {
      const copy = updateCopy(phase);
      expect(`${copy.title}${copy.line}${copy.action}`).not.toMatch(/—/);
    }
  });
});

describe('the chip for the notes held back', () => {
  it('counts them', () => {
    expect(moreLabel(3)).toBe('+ 3 more');
  });

  it('says what pressing it does, in the singular too', () => {
    expect(moreSpoken(3)).toBe('Show 3 more changes');
    expect(moreSpoken(1)).toBe('Show 1 more change');
  });
});
