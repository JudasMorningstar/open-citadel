import { describe, expect, it } from 'vitest';

import { enhancedVoiceEntry, enhancedVoiceRows, type VoiceNaming } from '../enhanced-voices';

const VOICES = ['f1', 'm2', 'f3'] as const;
type Voice = (typeof VOICES)[number];

const naming: VoiceNaming<Voice> = {
  label: (voice) => ({ f1: 'Aloy', m2: 'Geralt', f3: 'Yennefer' })[voice],
  descriptor: (voice) => ({ f1: 'Clear, polished', m2: 'Deep, serious', f3: 'Warm, measured' })[voice],
};

describe('enhancedVoiceRows', () => {
  it('gives a row to every voice, in the order given', () => {
    const rows = enhancedVoiceRows(VOICES, naming);
    expect(rows.map((row) => row.key)).toEqual(['f1', 'm2', 'f3']);
    expect(rows.every((row) => row.kind === 'voice')).toBe(true);
  });

  it('is empty for a voice box with no voices', () => {
    expect(enhancedVoiceRows([], naming)).toEqual([]);
  });
});

describe('enhancedVoiceEntry', () => {
  it('keeps the voice as its identifier, which is what makes a row playable', () => {
    expect(enhancedVoiceEntry('m2', naming).identifier).toBe('m2');
  });

  it('names the voice and puts its character where a phone voice puts its language', () => {
    expect(enhancedVoiceEntry('f1', naming)).toEqual({
      identifier: 'f1',
      name: 'Aloy',
      language: 'Clear, polished',
      quality: '',
    });
  });
});
