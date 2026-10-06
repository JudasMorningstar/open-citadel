import { describe, expect, it } from 'vitest';

import { fractionToSave, isReadThrough, learnPageStep, readFraction, sameSpot, type Spot } from '@/utils/read-progress';

const page = (progression: number, totalProgression = 0, href = 'OEBPS/article.xhtml'): Spot => ({
  href,
  locations: { progression, totalProgression },
});

describe('learnPageStep', () => {
  it('knows nothing before a page is turned', () => {
    expect(learnPageStep(null, null, page(0))).toBeNull();
    expect(learnPageStep(null, page(0.4), page(0.4))).toBeNull();
  });

  it('takes a turn as one page', () => {
    expect(learnPageStep(null, page(0), page(0.2))).toBeCloseTo(0.2);
    expect(learnPageStep(null, page(0.6), page(0.4))).toBeCloseTo(0.2);
  });

  it('keeps the smallest move, so a jump does not pass for a page', () => {
    const afterJump = learnPageStep(null, page(0), page(0.6));
    expect(afterJump).toBeCloseTo(0.6);
    expect(learnPageStep(afterJump, page(0.6), page(0.8))).toBeCloseTo(0.2);
    expect(learnPageStep(0.2, page(0.2), page(0.8))).toBeCloseTo(0.2);
  });

  it('starts again in another file', () => {
    expect(learnPageStep(0.2, page(0.8), page(0, 0, 'OEBPS/two.xhtml'))).toBeNull();
  });
});

describe('readFraction', () => {
  it('counts the page on screen as read in a one-file publication', () => {
    const options = { oneFile: true, pageStep: 0.2 };
    expect(readFraction(page(0, 0), options)).toBeCloseTo(0.2);
    expect(readFraction(page(0.4, 0.5), options)).toBeCloseTo(0.6);
  });

  it('is finished on the last page, where the reader itself says 50%', () => {
    expect(readFraction(page(0.8, 0.5), { oneFile: true, pageStep: 0.2 })).toBe(1);
    // Thirds do not sum to exactly one.
    expect(readFraction(page(2 / 3, 0.5), { oneFile: true, pageStep: 1 / 3 })).toBe(1);
  });

  it('falls back to the start of the page until a page has been turned', () => {
    expect(readFraction(page(0.8, 0.5), { oneFile: true, pageStep: null })).toBeCloseTo(0.8);
  });

  it("keeps the reader's own figure for a book", () => {
    expect(readFraction(page(0.8, 0.37), { oneFile: false, pageStep: 0.2 })).toBeCloseTo(0.37);
    expect(readFraction({ href: 'a' }, { oneFile: false, pageStep: null })).toBe(0);
  });
});

describe('readFraction, for a book', () => {
  it('is finished on the last page of the last file', () => {
    expect(readFraction(page(0.75, 0.97), { oneFile: false, pageStep: 0.25, lastFile: true })).toBe(1);
  });

  it('is not finished on the last page of any other file, or before a page is turned', () => {
    expect(readFraction(page(0.75, 0.4), { oneFile: false, pageStep: 0.25, lastFile: false })).toBeCloseTo(0.4);
    expect(readFraction(page(0.75, 0.97), { oneFile: false, pageStep: null, lastFile: true })).toBeCloseTo(0.97);
    expect(readFraction(page(0.5, 0.96), { oneFile: false, pageStep: 0.25, lastFile: true })).toBeCloseTo(0.96);
  });
});

describe('isReadThrough', () => {
  it('is what the header shows as 100%', () => {
    expect(isReadThrough(1)).toBe(true);
    expect(isReadThrough(0.996)).toBe(true);
    expect(isReadThrough(0.994)).toBe(false);
    expect(isReadThrough(0.8)).toBe(false);
    expect(isReadThrough(null)).toBe(false);
  });
});

describe('sameSpot', () => {
  it('is the same page of the same file', () => {
    expect(sameSpot(page(0.8), page(0.8))).toBe(true);
    expect(sameSpot(page(0.8), page(0.6))).toBe(false);
    expect(sameSpot(page(0.8), page(0.8, 0, 'other'))).toBe(false);
    expect(sameSpot(null, page(0.8))).toBe(false);
  });
});

describe('fractionToSave', () => {
  it('does not undo a finished post when it is opened again where it was left', () => {
    expect(fractionToSave(0.8, page(0.8), null, { fraction: 1, spot: page(0.8) })).toBe(1);
  });

  it('saves the new figure once the place has moved or the page is known', () => {
    expect(fractionToSave(0.6, page(0.6), null, { fraction: 1, spot: page(0.8) })).toBeCloseTo(0.6);
    expect(fractionToSave(0.8, page(0.6), 0.2, { fraction: 1, spot: page(0.6) })).toBeCloseTo(0.8);
    expect(fractionToSave(0.4, page(0.4), null, null)).toBeCloseTo(0.4);
  });

  it('raises a figure saved before this was counted properly', () => {
    expect(fractionToSave(0.8, page(0.8), null, { fraction: 0.5, spot: page(0.8) })).toBeCloseTo(0.8);
  });
});
