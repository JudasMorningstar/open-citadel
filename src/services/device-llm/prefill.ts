/**
 * How much text goes into one native prefill or generate call.
 *
 * Two things bound it, and both are fixed when a model is exported.
 *
 * The first is how many tokens `forward` takes in a call. Every catalogue
 * export takes 2047, except Gemma 4 E2B, which takes 1024 (read from the
 * programs themselves: the registry's `config.json` says 2048 for Gemma, and
 * is wrong). Past the bound the call is refused.
 *
 * The second is what a call costs in memory, and for most exports it is
 * little: they hand back logits for the last token only. Gemma 4 E2B hands
 * back logits for EVERY token it is fed, as two half-float tensors of
 * `tokens x 262144`, which is about 1 MiB written per token in the call. Fed
 * its instructions and tools (about 2300 tokens) in the 3000-character pieces
 * the other exports take, that was up to a gigabyte dirtied in one call, on
 * top of weights and a gigabyte of working memory the runtime commits at
 * load. On a 6 GB Galaxy A33 Android killed the app for it, in the
 * foreground, a minute or so into the first message.
 *
 * Memory once written stays with the process until the model is freed, so
 * the cost of a turn is the cost of its LARGEST call. Small pieces keep it
 * small. They are no slower to speak of: the work per token is the same,
 * only the calls are shorter.
 */

import type { CatalogueModel } from '@/services/device-llm/catalogue';

/**
 * Longest text handed to one call, for an export that returns one row of
 * logits however much it is fed.
 *
 * Kept well under the smallest per-call limit among them (2047 tokens) at
 * the most pessimistic tokenization our traffic sees (about 2 chars a token,
 * for ids and reference markers).
 */
export const PREFILL_CHUNK_CHARS = 3000;

/**
 * Longest text handed to one call, for an export that returns logits for
 * every token: 80 to 160 tokens, so at most about 160 MiB a call.
 */
export const PER_TOKEN_LOGITS_CHUNK_CHARS = 320;

/** No special token in the catalogue's tokenizers is longer than this. */
const LONGEST_SPECIAL_TOKEN = 32;

/** The longest text one native call may be handed, for this model. */
export function prefillChunkChars(entry: Pick<CatalogueModel, 'logitsPerToken'>): number {
  return entry.logitsPerToken ? PER_TOKEN_LOGITS_CHUNK_CHARS : PREFILL_CHUNK_CHARS;
}

/**
 * Where to cut `text` so the piece before it is no longer than `limit` and
 * the tokenizer reads the two pieces as it would have read them joined.
 */
function cutPoint(text: string, limit: number): number {
  // After a line break: chat templates never put a special token across one.
  const lineEnd = text.lastIndexOf('\n', limit - 1);
  if (lineEnd > 0) return lineEnd + 1;

  // Before a space: tokenizers attach a space to the word after it, so the
  // word keeps its token. A tool declaration is one long line, and without
  // this a small limit cut it wherever the count ran out.
  const space = text.lastIndexOf(' ', limit - 1);
  if (space > 0) return space;

  // Nowhere clean. Still never inside a special token (`<|turn>`, `<|"|>`):
  // cut in half, it would be read as loose characters.
  const open = text.lastIndexOf('<', limit - 1);
  if (open > 0 && limit - open < LONGEST_SPECIAL_TOKEN) {
    const close = text.indexOf('>', open);
    if (close >= limit && close - open < LONGEST_SPECIAL_TOKEN) return open;
  }
  return limit;
}

/** Splits text into pieces no longer than `limit`, at the cleanest break each allows. */
export function chunkForPrefill(text: string, limit = PREFILL_CHUNK_CHARS): string[] {
  if (text.length <= limit) return text ? [text] : [];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    const cut = cutPoint(rest, limit);
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest) chunks.push(rest);
  return chunks;
}
