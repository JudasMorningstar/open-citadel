import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  MAX_NOTE_LENGTH,
  NOTES_SHOWN,
  cleanNotes,
  noteProblems,
  notesFromManifest,
  notesToShow,
} from '../release-notes';

function manifestWith(releaseNotes: unknown) {
  return { id: 'abc', extra: { expoClient: { name: 'Open Citadel', extra: { releaseNotes } } } };
}

describe('cleanNotes', () => {
  it('keeps lines of text, trimmed', () => {
    expect(cleanNotes(['  Faster theme switch ', 'New voices'])).toEqual(['Faster theme switch', 'New voices']);
  });

  it('drops blanks, repeats and anything that is not text', () => {
    expect(cleanNotes(['New voices', '', '   ', 4, null, { a: 1 }, 'New voices'])).toEqual(['New voices']);
  });

  it('is empty for anything that is not a list', () => {
    expect(cleanNotes(undefined)).toEqual([]);
    expect(cleanNotes('New voices')).toEqual([]);
    expect(cleanNotes({ notes: ['New voices'] })).toEqual([]);
  });
});

describe('notesFromManifest', () => {
  it('reads the notes an update carries', () => {
    expect(notesFromManifest(manifestWith(['New voices', 'Bug fixes']))).toEqual(['New voices', 'Bug fixes']);
  });

  it('is empty when the update has none', () => {
    expect(notesFromManifest(manifestWith(undefined))).toEqual([]);
    expect(notesFromManifest({ id: 'abc', extra: { expoClient: {} } })).toEqual([]);
    expect(notesFromManifest({ id: 'abc' })).toEqual([]);
  });

  it('is empty for a rollback or a manifest that is not there', () => {
    expect(notesFromManifest(undefined)).toEqual([]);
    expect(notesFromManifest(null)).toEqual([]);
    expect(notesFromManifest('manifest')).toEqual([]);
  });

  it('survives notes of the wrong shape', () => {
    expect(notesFromManifest(manifestWith('New voices'))).toEqual([]);
    expect(notesFromManifest(manifestWith([1, 'New voices']))).toEqual(['New voices']);
  });
});

describe('notesToShow', () => {
  const six = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('shows a short list whole', () => {
    expect(notesToShow(['a', 'b'])).toEqual({ shown: ['a', 'b'], more: 0 });
  });

  it('shows the first few and counts the rest', () => {
    expect(notesToShow(six)).toEqual({ shown: six.slice(0, NOTES_SHOWN), more: six.length - NOTES_SHOWN });
  });

  it('counts nothing when the list fits exactly', () => {
    expect(notesToShow(six.slice(0, NOTES_SHOWN)).more).toBe(0);
  });

  it('shows everything once the rest was asked for', () => {
    expect(notesToShow(six, true)).toEqual({ shown: six, more: 0 });
  });

  it('has nothing to show for no notes', () => {
    expect(notesToShow([])).toEqual({ shown: [], more: 0 });
  });
});

describe('noteProblems', () => {
  it('passes a good set', () => {
    expect(noteProblems(['A faster theme switch', 'New Supertonic voices'])).toEqual([]);
  });

  it('wants a list with something in it', () => {
    expect(noteProblems(undefined)).toHaveLength(1);
    expect(noteProblems([])).toHaveLength(1);
  });

  it('lets a long list through, since the rest scroll', () => {
    const many = Array.from({ length: 34 }, (_, i) => `Note ${i}`);
    expect(noteProblems(many)).toEqual([]);
  });

  it('refuses a note too long to be a chip', () => {
    expect(noteProblems(['A'.repeat(MAX_NOTE_LENGTH)])).toEqual([]);
    expect(noteProblems(['A'.repeat(MAX_NOTE_LENGTH + 1)])).toHaveLength(1);
  });

  it('refuses dashes, closing punctuation and a lower-case start', () => {
    expect(noteProblems(['Faster — much faster'])).toHaveLength(1);
    expect(noteProblems(['Faster theme switch.'])).toHaveLength(1);
    expect(noteProblems(['faster theme switch'])).toHaveLength(1);
  });

  it('refuses a repeat, whatever its case', () => {
    expect(noteProblems(['New voices', 'New Voices'])).toHaveLength(1);
  });

  it('refuses an entry that is not text', () => {
    expect(noteProblems(['New voices', 3])).toHaveLength(1);
  });
});

/**
 * The notes that would go out with the next update. This is what the publish
 * script runs before it publishes anything.
 */
describe('release-notes.json', () => {
  const file = fileURLToPath(new URL('../../../../../release-notes.json', import.meta.url));
  const { notes } = JSON.parse(readFileSync(file, 'utf8')) as { notes: unknown };

  it('is fit to publish', () => {
    expect(noteProblems(notes)).toEqual([]);
  });
});
