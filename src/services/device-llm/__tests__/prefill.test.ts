import { describe, expect, it } from 'vitest';

import {
  chunkForPrefill,
  PER_TOKEN_LOGITS_CHUNK_CHARS,
  PREFILL_CHUNK_CHARS,
  prefillChunkChars,
} from '../prefill';

describe('prefillChunkChars', () => {
  it('feeds an export that returns logits per token in small pieces', () => {
    expect(prefillChunkChars({ logitsPerToken: true })).toBe(PER_TOKEN_LOGITS_CHUNK_CHARS);
    expect(prefillChunkChars({})).toBe(PREFILL_CHUNK_CHARS);
  });

  it('keeps a per-token call far under what killed the app', () => {
    // About 1 MiB a token, at a pessimistic 2 characters a token: the piece
    // must stay a small fraction of the gigabyte a 3000-character one cost.
    const worstCaseTokens = PER_TOKEN_LOGITS_CHUNK_CHARS / 2;
    expect(worstCaseTokens).toBeLessThanOrEqual(200);
    // And under Gemma 4 E2B's 1024 tokens a call, with room to spare.
    expect(PREFILL_CHUNK_CHARS / 2).toBeLessThan(2047);
  });
});

describe('chunkForPrefill', () => {
  it('passes short text through whole, and nothing for nothing', () => {
    expect(chunkForPrefill('hello', 10)).toEqual(['hello']);
    expect(chunkForPrefill('', 10)).toEqual([]);
  });

  it('breaks at line ends, never past the limit, and loses nothing', () => {
    const text = Array.from({ length: 40 }, (_, i) => `<|turn>line ${i}`).join('\n');
    const chunks = chunkForPrefill(text, 60);
    expect(chunks.join('')).toBe(text);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(60);
    for (const c of chunks.slice(0, -1)) expect(c.endsWith('\n')).toBe(true);
  });

  it('cuts mid-word only when there is nowhere better', () => {
    const chunks = chunkForPrefill('x'.repeat(25), 10);
    expect(chunks).toEqual(['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)]);
  });

  it('breaks a long line before a space, so each word keeps its token', () => {
    const text = 'You are Samwell, a reading companion who answers plainly and briefly.';
    const chunks = chunkForPrefill(text, 20);
    expect(chunks.join('')).toBe(text);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(20);
    // The space travels with the word after it, as tokenizers attach it.
    for (const c of chunks.slice(1)) expect(c.startsWith(' ')).toBe(true);
  });

  it('never cuts a special token in half', () => {
    // A tool declaration: one long line, no spaces, special tokens throughout.
    const text = Array.from({ length: 30 }, (_, i) => `name${i}:<|"|>value${i}<|"|>,`).join('');
    for (const limit of [17, 23, 31, 40]) {
      const chunks = chunkForPrefill(text, limit);
      expect(chunks.join('')).toBe(text);
      for (const c of chunks) {
        expect(c.length).toBeLessThanOrEqual(limit);
        // Every `<` a piece opens, it closes.
        expect(c.split('<').length).toBe(c.split('>').length);
      }
    }
  });

  it('always makes progress, even on text that is all one token opening', () => {
    const chunks = chunkForPrefill('<'.repeat(50), 8);
    expect(chunks.join('')).toBe('<'.repeat(50));
    for (const c of chunks) expect(c.length).toBeGreaterThan(0);
  });
});
