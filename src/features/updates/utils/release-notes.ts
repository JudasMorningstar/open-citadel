/**
 * What changed in an update, as the short lines the update dialog shows.
 *
 * They are written by hand in `release-notes.json` at the root, and reach the
 * app inside the update itself: `app.config.js` puts them in `extra`, which
 * every over-the-air update carries in its manifest. So the notes read here
 * are the new update's, before the app has restarted into it.
 */

/**
 * As many as the dialog draws at first: the ones that matter most, read in
 * one look. The rest wait behind a "+ N more" that opens them in place.
 */
export const NOTES_SHOWN = 4;
/**
 * A note is a tag of two or three words, so two of them share a row of the
 * dialog. A long one takes a row to itself and the tags turn into a list.
 */
export const MAX_NOTE_LENGTH = 24;

/** Strings only, trimmed, with blanks and repeats dropped. */
export function cleanNotes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const notes: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const note = entry.trim();
    if (note && !notes.includes(note)) notes.push(note);
  }
  return notes;
}

/**
 * The notes an update's manifest carries, or none: an update published before
 * there were notes, a rollback, and the build's own embedded manifest all have
 * nothing here, and the dialog then says only that there is an update.
 */
export function notesFromManifest(manifest: unknown): string[] {
  const extra = field(field(field(manifest, 'extra'), 'expoClient'), 'extra');
  return cleanNotes(field(extra, 'releaseNotes'));
}

function field(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) return undefined;
  return (value as Record<string, unknown>)[key];
}

/**
 * The notes to draw and how many are held back: the first few, or all of them
 * once someone has asked for the rest. They are written most important first.
 */
export function notesToShow(notes: string[], all: boolean = false): { shown: string[]; more: number } {
  const shown = all ? notes : notes.slice(0, NOTES_SHOWN);
  return { shown, more: notes.length - shown.length };
}

/**
 * What is wrong with a set of notes as written, one line per problem. Empty
 * when they are fit to publish. The test beside this runs it over
 * `release-notes.json`, which is what stops a publish with notes too long to
 * be read in passing. How many there are is not policed: the rest scroll in
 * their own box, and the first four are the ones that have to count.
 */
export function noteProblems(value: unknown): string[] {
  if (!Array.isArray(value)) return ['"notes" must be a list of short lines.'];
  const problems: string[] = [];
  if (value.length === 0) problems.push('There are no notes. Write at least one.');
  const seen = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== 'string' || !entry.trim()) {
      problems.push('Every note must be a line of text.');
      continue;
    }
    const note = entry.trim();
    if (note.length > MAX_NOTE_LENGTH) {
      problems.push(`"${note}" is ${note.length} characters. Keep a note to ${MAX_NOTE_LENGTH}.`);
    }
    if (/[–—]/.test(note)) problems.push(`"${note}" has a dash in it. Use plain words.`);
    if (/[.!]$/.test(note)) problems.push(`"${note}" ends in punctuation. A note is a label, not a sentence.`);
    if (note[0] !== note[0].toUpperCase()) problems.push(`"${note}" should start with a capital.`);
    if (seen.has(note.toLowerCase())) problems.push(`"${note}" is listed twice.`);
    seen.add(note.toLowerCase());
  }
  return problems;
}
