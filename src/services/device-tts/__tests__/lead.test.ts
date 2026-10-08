import { describe, expect, it } from 'vitest';

import {
  HEAD_CHARS,
  SUPERTONIC_STEPS,
  atBestSteps,
  headCharsFor,
  splitHead,
  supertonicParts,
  supertonicSteps,
} from '@/services/device-tts/lead';

const SENTENCE =
  'When one speaks of increasing power, machinery, and industry there comes up a picture of a cold, metallic sort of world.';

describe('headCharsFor', () => {
  it('starts short before the phone has been measured', () => {
    expect(headCharsFor(null)).toBe(HEAD_CHARS.unmeasured);
  });

  it('gives a phone near real time a short first piece', () => {
    // Two seconds of work at 0.8 is two and a half of speech.
    expect(headCharsFor(0.8)).toBe(43);
  });

  it('never goes under the least, however slow the phone', () => {
    expect(headCharsFor(3)).toBe(HEAD_CHARS.least);
  });

  it('gives a fast phone the pipeline whole limit', () => {
    expect(headCharsFor(0.1)).toBe(240);
  });
});

describe('splitHead', () => {
  it('leaves a short sentence whole', () => {
    expect(splitHead('The progress has been wonderful enough.', 40)).toEqual(['The progress has been wonderful enough.', '']);
  });

  it('leaves a sentence whole when only a few words would be left over', () => {
    const text = 'We have only started on our development of our country today.';
    expect(splitHead(text, 45)).toEqual([text, '']);
  });

  it('cuts after a comma in the back half of the window', () => {
    const [head, rest] = splitHead(SENTENCE, 50);
    expect(head).toBe('When one speaks of increasing power, machinery,');
    expect(rest).toBe('and industry there comes up a picture of a cold, metallic sort of world.');
  });

  it('cuts at the last space when there is no comma to cut at', () => {
    const [head, rest] = splitHead('We have only started on our development of our country and we have not finished.', 40);
    expect(head).toBe('We have only started on our development');
    expect(rest).toBe('of our country and we have not finished.');
  });

  it('passes over a comma too early to be worth stopping at', () => {
    const [head] = splitHead('Yes, we have only started on our development of our country and we have not finished.', 40);
    expect(head).toBe('Yes, we have only started on our');
  });

  it('leaves text with nowhere to cut whole', () => {
    const address = `https://example.com/${'a'.repeat(120)}`;
    expect(splitHead(address, 40)).toEqual([address, '']);
  });
});

describe('supertonicParts', () => {
  it('is one piece, at the pipeline own limit, when nothing is cut', () => {
    expect(supertonicParts('A short line.', 0.8)).toEqual([{ text: 'A short line.', limit: undefined }]);
  });

  it('is a short first piece, then the rest in pieces a little longer', () => {
    const [first, rest] = supertonicParts(SENTENCE, 0.8);
    expect(first).toEqual({ text: 'When one speaks of increasing power,', limit: undefined });
    expect(rest?.text).toBe('machinery, and industry there comes up a picture of a cold, metallic sort of world.');
    expect(rest?.limit).toBe(54);
  });

  it('never gives the rest shorter pieces than the first, on a phone that is behind', () => {
    const [, rest] = supertonicParts(SENTENCE, 2);
    expect(rest?.limit).toBe(HEAD_CHARS.least);
  });
});

describe('supertonicSteps', () => {
  it('starts in the middle before the phone has been measured', () => {
    expect(supertonicSteps(null)).toBe(SUPERTONIC_STEPS.unmeasured);
  });

  it('gives a phone that keeps up the best step count', () => {
    expect(supertonicSteps(0.4)).toBe(SUPERTONIC_STEPS.best);
    expect(supertonicSteps(0.8)).toBe(SUPERTONIC_STEPS.best);
  });

  it('gives a slower phone only the steps it can afford', () => {
    // A Galaxy A33: 1.4 at eight steps is about 0.78 at four.
    expect(supertonicSteps(1.4)).toBe(4);
    expect(supertonicSteps(1)).toBe(6);
  });

  it('never goes under the least step count', () => {
    expect(supertonicSteps(5)).toBe(SUPERTONIC_STEPS.least);
  });
});

describe('atBestSteps', () => {
  it('leaves work done at the best step count as it is', () => {
    expect(atBestSteps(9, SUPERTONIC_STEPS.best)).toBe(9);
  });

  it('scales work done in fewer steps up to what the best count would cost', () => {
    // Four steps and the vocoder are five ninths of eight steps and the vocoder.
    expect(atBestSteps(5, 4)).toBe(9);
  });
});
