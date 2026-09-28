/**
 * Reading a post's HTML for a list: its plain text, a short summary, and the
 * first picture worth showing. Pure; the reader itself never sees this, it
 * gets the HTML.
 */
import { decodeEntities } from '@/utils/html-entities';
import { resolveUrl } from '@/utils/urls';

/** A list row's summary: a couple of lines, never a wall. */
export const SUMMARY_LENGTH = 280;

/** Tags whose content is never prose. */
const HIDDEN = /<(script|style|noscript|template|svg|iframe|figcaption)\b[\s\S]*?<\/\1\s*>/gi;
/** Tags that end a line of text, so words either side of them do not run together. */
const BREAKS = /<\/?(p|div|br|li|ul|ol|h[1-6]|blockquote|tr|td|th|section|article|figure|pre|hr)\b[^>]*>/gi;

/** A fragment of HTML as one line of plain text. */
export function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(HIDDEN, ' ')
      .replace(BREAKS, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain text cut at a word to at most `max` characters, with an ellipsis when cut. */
export function summarize(text: string, max = SUMMARY_LENGTH): string | null {
  const value = text.trim();
  if (!value) return null;
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  // Already at a word's end when the next character is a space.
  const lastSpace = value[max - 1] === ' ' ? cut.length : cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, '')}…`;
}

const IMG_SRC = /<img\b[^>]*?\bsrc\s*=\s*(["'])(.*?)\1/i;

/**
 * The first image in a post, as an absolute address. Never an inline `data:`
 * image: those can be megabytes of base64, and have no business in a
 * database row or a list. Tracking pixels (1x1) are skipped too.
 */
export function firstImage(html: string | null, base: string | null): string | null {
  if (!html) return null;
  let rest = html;
  for (let i = 0; i < 5; i++) {
    const match = rest.match(IMG_SRC);
    if (!match || match.index == null) return null;
    const tag = rest.slice(match.index, rest.indexOf('>', match.index) + 1);
    rest = rest.slice(match.index + match[0].length);
    const src = decodeEntities(match[2]);
    if (src.startsWith('data:')) continue;
    if (/\b(width|height)\s*=\s*["']?1["'\s>]/i.test(tag)) continue;
    const url = resolveUrl(src, base);
    if (url && /^https?:/i.test(url)) return url;
  }
  return null;
}
