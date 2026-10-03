import { describe, expect, it } from 'vitest';

import {
  deviceVoiceName,
  deviceVoiceRows,
  isPlayableVoice,
  languageCode,
  sortVoices,
  usefulLanguages,
  type DeviceVoice,
} from '@/utils/device-voices';

const voice = (identifier: string, language: string, name = identifier): DeviceVoice => ({
  identifier,
  name,
  language,
  quality: 'DEFAULT',
});

const VOICES = [
  voice('fr-fr-x-a', 'fr-FR'),
  voice('en-us-x-b', 'en-US'),
  voice('en-gb-x-a', 'en-GB'),
  voice('zu-za-x-a', 'zu-ZA'),
  voice('en-us-x-a', 'en-US'),
];

const kinds = (rows: ReturnType<typeof deviceVoiceRows>) =>
  rows.map((row) => (row.kind === 'voice' ? row.voice.identifier || 'default' : row.kind === 'language' ? row.language : row.title));

describe('languageCode', () => {
  it('is the language of a tag, however it is written', () => {
    expect(languageCode('en-ZA')).toBe('EN');
    expect(languageCode('en_US')).toBe('EN');
    expect(languageCode('zu')).toBe('ZU');
  });
});

describe('isPlayableVoice', () => {
  it("drops Google's per-language placeholders", () => {
    expect(isPlayableVoice({ identifier: 'en-AU-language' })).toBe(false);
    expect(isPlayableVoice({ identifier: 'en-au-x-aua-local' })).toBe(true);
  });
});

describe('sortVoices', () => {
  it('orders by locale then name, whatever order the phone gave', () => {
    expect(sortVoices(VOICES).map((v) => v.identifier)).toEqual([
      'en-gb-x-a',
      'en-us-x-a',
      'en-us-x-b',
      'fr-fr-x-a',
      'zu-za-x-a',
    ]);
  });

  it('leaves the list it was given alone', () => {
    const before = VOICES.map((v) => v.identifier);
    sortVoices(VOICES);
    expect(VOICES.map((v) => v.identifier)).toEqual(before);
  });
});

describe('usefulLanguages', () => {
  it("is the saved voice's language, then the phone's", () => {
    expect(usefulLanguages(VOICES, 'fr-fr-x-a', 'en-ZA')).toEqual(['FR', 'EN']);
  });

  it('does not repeat a language that is both', () => {
    expect(usefulLanguages(VOICES, 'en-gb-x-a', 'en-ZA')).toEqual(['EN']);
  });

  it("is the phone's language alone with the system default chosen", () => {
    expect(usefulLanguages(VOICES, '', 'zu-ZA')).toEqual(['ZU']);
  });

  it('falls back to English when the phone has no voice in its own language', () => {
    expect(usefulLanguages(VOICES, '', 'xh-ZA')).toEqual(['EN']);
  });

  it('opens the only language there is', () => {
    expect(usefulLanguages([voice('de-de-x-a', 'de-DE')], '', 'xh-ZA')).toEqual(['DE']);
  });

  it('opens nothing when none of those apply', () => {
    expect(usefulLanguages([voice('de-de-x-a', 'de-DE'), voice('fr-fr-x-a', 'fr-FR')], '', 'xh-ZA')).toEqual([]);
    expect(usefulLanguages([], '', 'en-ZA')).toEqual([]);
  });
});

describe('deviceVoiceRows', () => {
  it('starts with the default and lists every language closed', () => {
    expect(kinds(deviceVoiceRows(VOICES, new Set()))).toEqual(['DEFAULT', 'default', 'EN', 'FR', 'ZU']);
  });

  it('draws voices only under open languages, with a count on every language', () => {
    const rows = deviceVoiceRows(sortVoices(VOICES), new Set(['EN']));
    expect(kinds(rows)).toEqual(['DEFAULT', 'default', 'EN', 'en-gb-x-a', 'en-us-x-a', 'en-us-x-b', 'FR', 'ZU']);
    expect(rows.filter((row) => row.kind === 'language')).toEqual([
      { kind: 'language', key: 'language:EN', language: 'EN', count: 3, open: true },
      { kind: 'language', key: 'language:FR', language: 'FR', count: 1, open: false },
      { kind: 'language', key: 'language:ZU', language: 'ZU', count: 1, open: false },
    ]);
  });

  it('leads with the useful languages, then English, then the rest by code', () => {
    expect(kinds(deviceVoiceRows(VOICES, new Set(), ['ZU']))).toEqual(['DEFAULT', 'default', 'ZU', 'EN', 'FR']);
  });

  it('keeps a language where it is when it opens or closes', () => {
    const order = (open: string[]) =>
      deviceVoiceRows(VOICES, new Set(open), ['ZU'])
        .filter((row) => row.kind === 'language')
        .map((row) => row.key);
    expect(order(['FR'])).toEqual(order([]));
    expect(order(['EN', 'FR', 'ZU'])).toEqual(order([]));
  });

  it('gives every row its own key', () => {
    const keys = deviceVoiceRows(VOICES, new Set(['EN', 'FR', 'ZU'])).map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('deviceVoiceName', () => {
  it('names the default, a known voice, and a saved voice the phone no longer lists', () => {
    expect(deviceVoiceName(VOICES, '')).toBe('System default');
    expect(deviceVoiceName([voice('id', 'en-US', 'Tessa')], 'id')).toBe('Tessa');
    expect(deviceVoiceName([], 'com.apple.voice.en-ZA.Tessa')).toBe('Tessa');
  });
});
