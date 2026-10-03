import { describe, expect, it } from 'vitest';

import { interruptedMessage, tooLargeMessage, wakeRoom } from '../wake-room';

describe('wakeRoom', () => {
  it('refuses a brain the phone cannot hold, rather than letting Android kill the app', () => {
    expect(wakeRoom('wontRun')).toBe('refuse');
  });

  it('frees what else is held when the fit is tight', () => {
    expect(wakeRoom('tight')).toBe('makeRoom');
  });

  it('just loads when there is room', () => {
    expect(wakeRoom('fits')).toBe('load');
  });
});

describe('what the reader is told', () => {
  it('names the brain and the phone, in plain words', () => {
    expect(tooLargeMessage('Gemma 4 E2B', 4 * 1024 ** 3)).toBe(
      'Gemma 4 E2B needs more memory than this phone has (4.0 GB). Choose a smaller brain.',
    );
    // No figure is better than a wrong one.
    expect(tooLargeMessage('Gemma 4 E2B', 0)).toBe(
      'Gemma 4 E2B needs more memory than this phone has. Choose a smaller brain.',
    );
  });

  it('blames memory only where the fit is tight', () => {
    expect(interruptedMessage('tight')).toContain('tight fit');
    expect(interruptedMessage('fits')).not.toContain('tight fit');
  });

  it('keeps to the copy rules: no em dashes, and Samwell is never "it"', () => {
    const copy = [tooLargeMessage('Qwen 3 4B', 3 * 1024 ** 3), interruptedMessage('tight'), interruptedMessage('fits')];
    for (const line of copy) {
      expect(line).not.toMatch(/[—–]/);
      expect(line).not.toMatch(/Samwell[^.]*\bit (is|was|stopped)\b/);
    }
  });
});
