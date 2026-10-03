/** One of the phone's own text-to-speech voices. */
export type DeviceVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

/**
 * One row of the voice list: the heading over the default, a language that
 * opens and closes, or a voice under an open one.
 */
export type DeviceVoiceRow =
  | { kind: 'header'; key: string; title: string }
  | { kind: 'language'; key: string; language: string; count: number; open: boolean }
  | { kind: 'voice'; key: string; voice: DeviceVoice };

/** The row that means "no particular voice": the phone's default. */
export const SYSTEM_DEFAULT_VOICE: DeviceVoice = {
  identifier: '',
  name: 'System default',
  language: '',
  quality: '',
};

/**
 * Google's Android TTS lists a placeholder per language ("en-AU-language")
 * next to its real voices. It has no voice data of its own, so choosing it just
 * asks the engine to download something and speaks in another voice meanwhile.
 */
export function isPlayableVoice(voice: { identifier: string }): boolean {
  return !/-language$/i.test(voice.identifier);
}

/** iOS identifiers end in the display name, for example `.en-ZA.Tessa`. */
function nameFromIdentifier(identifier: string): string {
  return identifier.split('.').at(-1)?.trim() || 'Selected voice';
}

/** The language a voice or a locale belongs under: "EN" for `en-ZA`, `en_US` or `en`. */
export function languageCode(tag: string): string {
  return tag.split(/[-_]/)[0].toUpperCase();
}

/*
 * Plain comparison, not `localeCompare`: Hermes hands every call of that to
 * the platform's collator, and a few thousand of them is a visible wait on a
 * slow phone. These are language tags and voice ids, which are ASCII.
 */
function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The voices in one fixed order: by locale, then by name. Android hands them
 * over as a set, in a different order every time it is asked.
 */
export function sortVoices(voices: DeviceVoice[]): DeviceVoice[] {
  return [...voices].sort((a, b) => compare(a.language, b.language) || compare(a.name, b.name));
}

/**
 * The languages worth showing open: the saved voice's and the phone's own.
 * English stands in when the phone has voices for neither, since that is what
 * most books here are in, and a phone with one language has nothing to hide.
 *
 * Everything else stays one tap deeper. Google's engine lists hundreds of
 * voices across dozens of languages, and the list draws every row it is
 * given, so the fewer it opens on the sooner it is there.
 */
export function usefulLanguages(voices: DeviceVoice[], selected: string, phoneLocale: string): string[] {
  const present = new Set(voices.map((voice) => languageCode(voice.language)));
  const saved = voices.find((voice) => voice.identifier === selected);
  const wanted = [saved ? languageCode(saved.language) : '', languageCode(phoneLocale)];
  const useful = [...new Set(wanted)].filter((language) => present.has(language));
  if (useful.length > 0) return useful;
  if (present.has('EN')) return ['EN'];
  return present.size === 1 ? [...present] : [];
}

/**
 * The list as rows: the default first, then every language as a row of its
 * own with its voices under it when it is open. `first` (the useful languages)
 * lead, in the order given, then English, then the rest by code. The order
 * never depends on what is open, so opening a language does not move it.
 */
export function deviceVoiceRows(
  voices: DeviceVoice[],
  open: ReadonlySet<string>,
  first: readonly string[] = [],
): DeviceVoiceRow[] {
  const byLanguage = new Map<string, DeviceVoice[]>();
  for (const voice of voices) {
    const language = languageCode(voice.language);
    const group = byLanguage.get(language);
    if (group) group.push(voice);
    else byLanguage.set(language, [voice]);
  }

  const lead = [...first, 'EN'];
  const rank = (language: string) => {
    const index = lead.indexOf(language);
    return index === -1 ? lead.length : index;
  };
  const languages = [...byLanguage.keys()].sort((a, b) => rank(a) - rank(b) || compare(a, b));

  const rows: DeviceVoiceRow[] = [
    { kind: 'header', key: 'header:DEFAULT', title: 'DEFAULT' },
    { kind: 'voice', key: '__default__', voice: SYSTEM_DEFAULT_VOICE },
  ];
  for (const language of languages) {
    const group = byLanguage.get(language) ?? [];
    const isOpen = open.has(language);
    rows.push({ kind: 'language', key: `language:${language}`, language, count: group.length, open: isOpen });
    if (!isOpen) continue;
    for (const voice of group) rows.push({ kind: 'voice', key: voice.identifier, voice });
  }
  return rows;
}

/** The name to show for the saved voice `identifier` ('' or unknown-but-set are handled). */
export function deviceVoiceName(voices: DeviceVoice[], identifier: string): string {
  if (!identifier) return SYSTEM_DEFAULT_VOICE.name;
  return voices.find((voice) => voice.identifier === identifier)?.name ?? nameFromIdentifier(identifier);
}
