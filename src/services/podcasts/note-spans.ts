/** Finding the timestamps and bare links inside a run of show-notes text. Pure. */

export type NoteSpan = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  href?: string;
  /** A timestamp in the notes, in seconds. Tapping it seeks the episode. */
  seekSec?: number;
};

export type NoteBlock = {
  kind: "paragraph" | "item" | "heading";
  spans: NoteSpan[];
};

const TIMESTAMP = /\b(?:(\d{1,2}):)?([0-5]?\d):([0-5]\d)\b/g;
const URL = /\bhttps?:\/\/[^\s<>"')\]]+[^\s<>"')\].,;:!?]/g;

/** Splits a plain run on timestamps and bare URLs. */
export function annotate(span: NoteSpan): NoteSpan[] {
  if (span.href || span.seekSec != null) return [span];
  const marks: { start: number; end: number; make: (text: string) => NoteSpan }[] = [];
  for (const m of span.text.matchAll(URL)) {
    marks.push({ start: m.index, end: m.index + m[0].length, make: (text) => ({ ...span, text, href: text }) });
  }
  for (const m of span.text.matchAll(TIMESTAMP)) {
    const start = m.index;
    const end = start + m[0].length;
    if (marks.some((mark) => start < mark.end && end > mark.start)) continue;
    const seconds = Number(m[1] ?? 0) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    marks.push({ start, end, make: (text) => ({ ...span, text, seekSec: seconds }) });
  }
  if (marks.length === 0) return [span];
  marks.sort((a, b) => a.start - b.start);
  const out: NoteSpan[] = [];
  let cursor = 0;
  for (const mark of marks) {
    if (mark.start > cursor) out.push({ ...span, text: span.text.slice(cursor, mark.start) });
    out.push(mark.make(span.text.slice(mark.start, mark.end)));
    cursor = mark.end;
  }
  if (cursor < span.text.length) out.push({ ...span, text: span.text.slice(cursor) });
  return out;
}
