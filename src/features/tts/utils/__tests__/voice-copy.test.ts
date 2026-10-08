import { describe, expect, it } from 'vitest';

import {
  LITE_SPEED_FIXED,
  CLOUD_VOICES_SOON,
  ENHANCED_UNSUPPORTED,
  ON_DEVICE_KINDS,
  onDeviceHint,
  onDeviceKindName,
} from '../voice-copy';

describe('the on-device kinds', () => {
  it('climbs from Lite to Enhanced', () => {
    expect(ON_DEVICE_KINDS.map((kind) => kind.mode)).toEqual(['native', 'ai']);
  });

  it('names each by what it asks of the phone', () => {
    expect(onDeviceKindName('native')).toBe('Lite');
    expect(onDeviceKindName('ai')).toBe('Enhanced');
  });
});

describe('onDeviceHint', () => {
  it('says what each kind is like', () => {
    expect(onDeviceHint('native')).toBe('Lightweight. Works on most phones.');
    expect(onDeviceHint('ai')).toBe('Sounds more human.');
  });
});

describe('the copy', () => {
  it('never uses an em dash', () => {
    const lines = [LITE_SPEED_FIXED, CLOUD_VOICES_SOON, ENHANCED_UNSUPPORTED, onDeviceHint('native'), onDeviceHint('ai')];
    for (const line of lines) expect(line).not.toMatch(/—/);
  });
});
