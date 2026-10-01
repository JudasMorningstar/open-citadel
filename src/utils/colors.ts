/**
 * `useCSSVariable` (from 'uniwind') can resolve a token to a number for
 * non-colour CSS custom properties; colour tokens always resolve to a
 * string, so anything else collapses to `undefined` rather than being
 * passed on to a prop that expects a colour (e.g. `ColorValue`, which does
 * not accept `number`).
 */
export function asColor(value: string | number | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
