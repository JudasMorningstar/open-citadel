/** Small words that do not make an initial: "The Point" is P, not TP. */
const SKIP = new Set(['the', 'a', 'an', 'of', 'and', 'on', 'in', 'for', 'to', 'by']);

/**
 * A name's initials, at most two, for a tile with no picture: "Farnam Street"
 * is FS, "The Marginalian" is M, "1000-Word Philosophy" is 1W. Pure.
 */
export function monogramOf(name: string): string {
  const words = name
    .replace(/['’]/g, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const meaningful = words.filter((w) => !SKIP.has(w.toLowerCase()));
  const picked = (meaningful.length > 0 ? meaningful : words).slice(0, 2);
  return picked.map((w) => w[0]!.toUpperCase()).join('') || '?';
}
