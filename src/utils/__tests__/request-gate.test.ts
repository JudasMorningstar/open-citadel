import { describe, expect, it } from 'vitest';

import { createRequestGate } from '@/utils/request-gate';

describe('createRequestGate', () => {
  it('lets the cap through at once and the rest in the order they asked', async () => {
    const turn = createRequestGate(2);
    const order: string[] = [];

    const first = await turn();
    const second = await turn();
    const third = turn().then((done) => {
      order.push('third');
      return done;
    });
    const fourth = turn().then((done) => {
      order.push('fourth');
      return done;
    });
    await Promise.resolve();
    expect(order).toEqual([]);

    first();
    (await third)();
    second();
    (await fourth)();
    expect(order).toEqual(['third', 'fourth']);
  });
});
