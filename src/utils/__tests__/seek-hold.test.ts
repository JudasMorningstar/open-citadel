import { describe, expect, it } from 'vitest';

import { heldPosition, SEEK_HOLD_MS } from '@/utils/seek-hold';

describe('heldPosition', () => {
  it('passes the reported position through when nothing was sought', () => {
    expect(heldPosition(42, null, 0)).toEqual({ position: 42, released: false });
  });

  it('keeps the target while the player still reports where it was', () => {
    expect(heldPosition(10, { target: 600, at: 1000 }, 1200)).toEqual({ position: 600, released: false });
  });

  it('lets go once the player has arrived at the target', () => {
    expect(heldPosition(600.8, { target: 600, at: 1000 }, 1300)).toEqual({ position: 600.8, released: true });
  });

  it('lets go when the wait runs out, so a seek that failed cannot pin the bar', () => {
    expect(heldPosition(10, { target: 600, at: 1000 }, 1000 + SEEK_HOLD_MS + 1)).toEqual({ position: 10, released: true });
  });
});
