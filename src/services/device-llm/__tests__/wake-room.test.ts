import { describe, expect, it } from 'vitest';

import { closedByPhoneMessage, closedByPhoneNotice, faultMessage, interruptedMessage, tooLargeMessage, wakeRoom } from '../wake-room';

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

describe('what the reader is told when the death is on record', () => {
  it('says the phone closed the app, and how much it was using when that is known', () => {
    expect(closedByPhoneMessage('Gemma 4 E2B', 4.4 * 1024 ** 3)).toBe(
      'Your phone closed the app the last time Gemma 4 E2B was running, to get its memory back. It was using 4.4 GB. Choose a smaller brain.',
    );
    expect(closedByPhoneMessage('Gemma 4 E2B', null)).not.toContain('GB');
  });

  it('does not tell the reader of a brain that fits to choose a smaller one', () => {
    expect(closedByPhoneMessage('Qwen 3 1.7B', 1.3 * 1024 ** 3, true)).toBe(
      'Your phone closed the app the last time Qwen 3 1.7B was running, to get its memory back. It was using 1.3 GB. Close other apps and try again.',
    );
  });

  it('has a short form for a toast', () => {
    expect(closedByPhoneNotice('Qwen 3 1.7B')).toBe(
      'Your phone closed the app over Qwen 3 1.7B last time. Tap CLOSED BY PHONE to see why.',
    );
  });

  it('does not blame memory for a fault', () => {
    expect(faultMessage('a native crash, signal 11')).toBe(
      "Samwell stopped last time because of a fault in the app (a native crash, signal 11), not your phone's memory.",
    );
  });
});
