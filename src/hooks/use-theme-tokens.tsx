import React from 'react';
import { useCSSVariable } from 'uniwind';

import { asColor } from '@/utils/colors';

/**
 * The theme tokens the app's two most-instantiated primitives need, resolved
 * once for the whole tree.
 *
 * `useCSSVariable` subscribes each caller to Uniwind's theme store
 * individually, and answers a theme change with a `setState` per subscriber.
 * That is fine for a screen that calls it once; it is not fine for
 * `ThemedText`, which appears two or three times in every list row — a
 * twenty-book grid alone opens forty subscriptions, and a single theme flip
 * then schedules forty separate updates on top of every other subscriber in
 * the app. That fan-out is what made the toggle lag behind the switch, and it
 * is paid again on every mount: a sheet's rows each open (and tear down) their
 * own subscription before the sheet can measure and start animating.
 *
 * One subscription here, one context value, one update. Consumers re-render
 * from context, which React propagates directly to them without scheduling
 * per-component work.
 *
 * Deliberately narrow: this is not a general theming layer, it is the set of
 * tokens whose call sites are multiplied by list length. A screen that reads a
 * token once should keep calling `useCSSVariable` — it costs one subscription
 * and stays local to the thing that needs it.
 */
const TOKENS = [
  '--color-foreground',
  '--color-background',
  '--color-card',
  '--color-muted',
  '--color-surface-tertiary',
  // For list rows that draw gold and secondary text (the podcast shelves and
  // episode lists): one shared read instead of a subscription per row.
  '--color-primary',
  '--color-muted-foreground',
] as const;

type TokenName = (typeof TOKENS)[number];
export type ThemeTokens = Record<TokenName, string | undefined>;

/** Stable identity so the hook below never re-resolves on a re-render. */
const TOKEN_LIST: string[] = [...TOKENS];

const EMPTY: ThemeTokens = {
  '--color-foreground': undefined,
  '--color-background': undefined,
  '--color-card': undefined,
  '--color-muted': undefined,
  '--color-surface-tertiary': undefined,
  '--color-primary': undefined,
  '--color-muted-foreground': undefined,
};

/**
 * Two contexts, not one, and the reason is how React finds who to redraw.
 *
 * When a provider's value changes, React marks every reader of that context
 * below it, readers under a nearer provider of the same context included: it
 * does not stop at the nearer one. So one root provider over the per-part
 * providers of `ThemeScope` had every `ThemedText` in the app run again
 * whenever the root's theme moved, though each takes its tokens from its own
 * part. On a Galaxy A33 that was most of what a theme change cost.
 *
 * Here a part's tokens and the app-wide ones are different contexts. A reader
 * under a part reads only the part's, so the app-wide one changing is not its
 * business; anything outside every part (the root layout, and whatever is
 * presented through a portal: sheets, dialogs, toasts) reads the app-wide one.
 */
const ScopedTokensContext = React.createContext<ThemeTokens | null>(null);
const RootTokensContext = React.createContext<ThemeTokens>(EMPTY);

function useResolvedTokens(): ThemeTokens {
  const values = useCSSVariable(TOKEN_LIST);

  return React.useMemo(() => {
    const next = {} as ThemeTokens;
    for (let i = 0; i < TOKENS.length; i++) {
      next[TOKENS[i]] = asColor(values[i]);
    }
    return next;
  }, [values]);
}

/** The tokens of one part of the app, resolved under its `ThemeScope`. */
export function ThemeTokensProvider({ children }: { children: React.ReactNode }) {
  const tokens = useResolvedTokens();
  return <ScopedTokensContext.Provider value={tokens}>{children}</ScopedTokensContext.Provider>;
}

/**
 * The app-wide tokens, for what is outside every `ThemeScope`. Mounted once at
 * the root, above the portal hosts, so a sheet or a toast is inside it.
 */
export function RootThemeTokens({ children }: { children: React.ReactNode }) {
  const tokens = useResolvedTokens();
  return <RootTokensContext.Provider value={tokens}>{children}</RootTokensContext.Provider>;
}

/**
 * The resolved tokens. Live: re-renders the caller on a theme change.
 *
 * `use`, not `useContext`, because the second read is conditional: a reader
 * under a part must not read the app-wide context at all (see above).
 */
export function useThemeTokens(): ThemeTokens {
  const scoped = React.use(ScopedTokensContext);
  return scoped ?? React.use(RootTokensContext);
}
