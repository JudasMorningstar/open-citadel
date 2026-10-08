/**
 * A name made safe to be part of a `file://` URL: ASCII letters, digits, `-`
 * and `_`, with every other run of characters collapsed to one `_`.
 *
 * Readium, `readAsStringAsync` and the chapter extractor all take the path
 * as it stands, with no percent-encoding, so a name with spaces or accents
 * breaks them. Non-ASCII titles are recovered from the EPUB's own metadata
 * when it is scanned, so losing them from the file name costs nothing.
 */
export function safeFileStem(name: string, maxLength?: number): string {
  const cleaned = name
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9-_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return (maxLength ? cleaned.slice(0, maxLength) : cleaned) || 'book';
}
