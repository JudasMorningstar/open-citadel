/** One of the phone's own text-to-speech voices. */
export type DeviceVoice = {
  identifier: string;
  name: string;
  language: string;
  quality: string;
};

/** One row of the voice list: a language heading, or a voice under it. */
export type DeviceVoiceRow =
  | { kind: 'header'; key: string; title: string }
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

/**
 * The list a recycling list wants: the default first, then the voices grouped
 * under a heading per language, English first since that is what the books
 * here are mostly in. Headings are rows of their own because FlashList has no
 * sections.
 */
export function deviceVoiceRows(voices: DeviceVoice[]): DeviceVoiceRow[] {
  const byLanguage: Record<string, DeviceVoice[]> = {};
  for (const voice of voices) {
    const language = voice.language.split('-')[0].toUpperCase();
    (byLanguage[language] ??= []).push(voice);
  }
  const groups = Object.entries(byLanguage).sort(([a], [b]) => {
    if (a === 'EN' || b === 'EN') return a === 'EN' ? -1 : 1;
    return a.localeCompare(b);
  });

  const rows: DeviceVoiceRow[] = [
    { kind: 'header', key: 'header:DEFAULT', title: 'DEFAULT' },
    { kind: 'voice', key: '__default__', voice: SYSTEM_DEFAULT_VOICE },
  ];
  for (const [title, data] of groups) {
    rows.push({ kind: 'header', key: `header:${title}`, title });
    for (const voice of data) rows.push({ kind: 'voice', key: voice.identifier, voice });
  }
  return rows;
}

/** The name to show for the saved voice `identifier` ('' or unknown-but-set are handled). */
export function deviceVoiceName(voices: DeviceVoice[], identifier: string): string {
  if (!identifier) return SYSTEM_DEFAULT_VOICE.name;
  return voices.find((voice) => voice.identifier === identifier)?.name ?? nameFromIdentifier(identifier);
}
