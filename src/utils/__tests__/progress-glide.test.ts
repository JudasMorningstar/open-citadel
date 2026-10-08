import { describe, expect, it } from 'vitest';

import {
  downloadLabel,
  GLIDE_FIRST_MS,
  GLIDE_MAX_MS,
  GLIDE_MIN_MS,
  glideDuration,
  percentLabel,
} from '@/utils/progress-glide';

describe('glideDuration', () => {
  it('lands the first sample quickly', () => {
    expect(glideDuration(null, 10_000)).toBe(GLIDE_FIRST_MS);
  });

  it('takes as long as the last sample took to arrive', () => {
    expect(glideDuration(10_000, 12_000)).toBe(2_000);
    expect(glideDuration(10_000, 10_400)).toBe(400);
  });

  it('is bounded both ways', () => {
    expect(glideDuration(10_000, 10_020)).toBe(GLIDE_MIN_MS);
    expect(glideDuration(10_000, 14_000)).toBe(GLIDE_MAX_MS);
  });

  it('does not crawl after a stall', () => {
    expect(glideDuration(10_000, 40_000)).toBe(GLIDE_FIRST_MS);
  });
});

describe('percentLabel', () => {
  it('prints whole percents', () => {
    expect(percentLabel(0)).toBe('0%');
    expect(percentLabel(0.256)).toBe('25%');
  });

  it('holds 100 back until the work is done', () => {
    expect(percentLabel(0.999)).toBe('99%');
    expect(percentLabel(1)).toBe('100%');
  });

  it('survives a figure outside the range', () => {
    expect(percentLabel(-0.2)).toBe('0%');
    expect(percentLabel(1.4)).toBe('100%');
  });
});

describe('downloadLabel', () => {
  it('says it is starting until something has arrived', () => {
    expect(downloadLabel(0)).toBe('STARTING');
  });

  it('then says how far along it is', () => {
    expect(downloadLabel(0.004)).toBe('0%');
    expect(downloadLabel(0.5)).toBe('50%');
  });
});
