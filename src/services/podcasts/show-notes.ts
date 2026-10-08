/**
 * Show notes, from the HTML a feed sends to something a screen can draw.
 *
 * Deliberately not a web view. Show notes are paragraphs, lists and links,
 * and a web view for those would bring its own fonts, its own colours, its own
 * scroll and a second of start-up, all to look worse than the reading type the
 * rest of the app already has. So the HTML is reduced to blocks of styled runs
 * and the screen sets them in the house type.
 *
 * Two things are added on the way through, both AntennaPod ideas: a timestamp
 * in the text ("at 12:34 we talk about…") becomes a run the listener can tap
 * to jump there, and a bare URL becomes a link.
 *
 * Pure, and tested.
 */
import { annotate, type NoteBlock, type NoteSpan } from "@/services/podcasts/note-spans";
import { decodeEntities } from "@/utils/html-entities";

export type { NoteBlock, NoteSpan } from "@/services/podcasts/note-spans";

const BLOCK_TAGS = new Set(["p", "div", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "ul", "ol", "section", "article", "tr", "table"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const DROP_CONTENT_TAGS = new Set(["script", "style", "iframe", "figure", "img"]);

function pushSpan(block: NoteBlock, span: NoteSpan) {
  const last = block.spans[block.spans.length - 1];
  if (
    last &&
    last.bold === span.bold &&
    last.italic === span.italic &&
    last.href === span.href &&
    last.seekSec == null &&
    span.seekSec == null
  ) {
    last.text += span.text;
  } else {
    block.spans.push(span);
  }
}

/** Collapses whitespace inside a block and drops blocks with nothing left in them. */
function tidy(blocks: NoteBlock[]): NoteBlock[] {
  const result: NoteBlock[] = [];
  for (const block of blocks) {
    const spans = block.spans
      .map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ") }))
      .filter((s) => s.text.length > 0);
    if (spans.length === 0) continue;
    spans[0].text = spans[0].text.trimStart();
    spans[spans.length - 1].text = spans[spans.length - 1].text.trimEnd();
    const kept = spans.filter((s) => s.text.length > 0);
    if (kept.length === 0) continue;
    result.push({ kind: block.kind, spans: kept.flatMap(annotate) });
  }
  return result;
}

export function parseShowNotes(input: string | null | undefined): NoteBlock[] {
  if (!input) return [];
  const source = input.trim();
  if (!/<[a-z!/][^>]*>/i.test(source)) {
    // Plain text: a blank line is a paragraph, a single newline a line break.
    return tidy(
      decodeEntities(source)
        .split(/\n\s*\n|\r\n\s*\r\n/)
        .map((p) => ({ kind: "paragraph" as const, spans: [{ text: p }] })),
    );
  }

  const blocks: NoteBlock[] = [];
  let current: NoteBlock = { kind: "paragraph", spans: [] };
  let bold = 0;
  let italic = 0;
  const links: (string | undefined)[] = [];
  let dropping = 0;

  const breakBlock = (kind: NoteBlock["kind"] = "paragraph") => {
    if (current.spans.length > 0) blocks.push(current);
    current = { kind, spans: [] };
  };

  for (const token of source.split(/(<[^>]*>)/)) {
    if (!token) continue;
    if (token[0] !== "<") {
      if (dropping > 0) continue;
      pushSpan(current, {
        text: decodeEntities(token),
        bold: bold > 0 || undefined,
        italic: italic > 0 || undefined,
        href: links[links.length - 1],
      });
      continue;
    }
    const match = token.match(/^<\s*(\/)?\s*([a-z0-9]+)([^>]*)>$/i);
    if (!match) continue;
    const closing = !!match[1];
    const tag = match[2].toLowerCase();
    const attrs = match[3];
    const selfClosing = /\/\s*$/.test(attrs);

    if (DROP_CONTENT_TAGS.has(tag)) {
      if (tag === "img" || selfClosing) continue;
      dropping += closing ? -1 : 1;
      dropping = Math.max(0, dropping);
      continue;
    }
    if (tag === "br") {
      breakBlock(current.kind === "item" ? "item" : "paragraph");
      continue;
    }
    if (tag === "b" || tag === "strong") bold += closing ? -1 : 1;
    else if (tag === "i" || tag === "em") italic += closing ? -1 : 1;
    else if (tag === "a") {
      if (closing) links.pop();
      else {
        const href = attrs.match(/href\s*=\s*["']([^"']+)["']/i)?.[1];
        links.push(href && /^(https?:|mailto:)/i.test(href) ? decodeEntities(href) : undefined);
      }
    } else if (BLOCK_TAGS.has(tag)) {
      if (closing) breakBlock();
      else if (tag === "li") breakBlock("item");
      else if (HEADING_TAGS.has(tag)) breakBlock("heading");
      else breakBlock();
    }
    bold = Math.max(0, bold);
    italic = Math.max(0, italic);
  }
  breakBlock();
  return tidy(blocks);
}

/** The notes as one line of plain text, cut at a word, for a list row. */
export function summarizeShowNotes(input: string | null | undefined, max = 220): string | null {
  const text = parseShowNotes(input)
    .map((b) => b.spans.map((s) => s.text).join(""))
    .join(" ")
    .trim();
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

/** The notes as plain paragraphs, for a description drawn as one block of text. */
export function showNotesToText(input: string | null | undefined): string | null {
  const text = parseShowNotes(input)
    .map((b) => b.spans.map((s) => s.text).join(""))
    .join("\n\n")
    .trim();
  return text || null;
}
