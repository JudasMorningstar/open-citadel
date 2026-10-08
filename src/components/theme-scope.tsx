import React from 'react';
import { ScopedTheme, Uniwind } from 'uniwind';

import { ThemeTokensProvider } from '@/hooks/use-theme-tokens';
import { useThemeSetting } from '@/hooks/use-theme';
import type { AppTheme } from '@/stores/settings';
import { THEME_ORDER, nextRelease, releasedThrough, type Released } from '@/utils/theme-order';

/** The theme chosen, and how far down the order it has been handed out. */
const ReleaseContext = React.createContext<Released<AppTheme> | null>(null);

/**
 * Hands a new theme out to the app a step at a time. Mounted once, above
 * every `ThemeScope`.
 *
 * The part at `THEME_ORDER.now` has it with the press. Each step after that is
 * a transition of its own, started once the one before it is on screen: work
 * React can put down for a press, and small enough that putting it down
 * costs one step and not the whole app (see `utils/theme-order`).
 *
 * Whatever is outside every scope follows Uniwind's own app-wide theme: the
 * root layout, and anything presented through a portal (sheets, dialogs,
 * toasts), which is drawn where its host is and not where it was opened.
 * That theme moves at `THEME_ORDER.next`. Setting it also forces the native
 * `Appearance` to match, which is what platform surfaces (the keyboard, a
 * system dialog) take their colours from.
 */
export function ThemeRelease({ children }: { children: React.ReactNode }) {
  const theme = useThemeSetting();
  const [released, setReleased] = React.useState<Released<AppTheme>>({ theme, through: THEME_ORDER.last });
  const through = releasedThrough(released, theme);

  React.useEffect(() => {
    const next = nextRelease(released, theme);
    if (!next) return;
    // From an effect, so the step just handed out is on screen before the next
    // is begun.
    // The app-wide theme is a handful of views (the layout, whatever sheet or
    // toast is up), so it is simply set; a scope can be a whole page.
    if (next.through === THEME_ORDER.next) Uniwind.setTheme(next.theme);
    React.startTransition(() => setReleased(next));
  }, [released, theme]);

  const value = React.useMemo(() => ({ theme, through }), [theme, through]);
  return <ReleaseContext.Provider value={value}>{children}</ReleaseContext.Provider>;
}

type ThemeScopeProps = {
  /**
   * When this part of the app takes a new theme: `THEME_ORDER.now` for the
   * screen the switch is on, and a later step the further it is from being
   * seen. See `utils/theme-order` for who is when.
   */
  order: number;
  children: React.ReactNode;
};

/**
 * Hands a part of the app its theme.
 *
 * A theme change used to reach every mounted component at once: Uniwind told
 * all of them through its own store and React drew the whole app again in one
 * pass it could not put down. The app keeps a great deal mounted (every screen
 * under the one showing, the hub's three pages, the panes of Settings), and on
 * a Galaxy A33 that pass was 2.4 seconds in which nothing answered, the switch
 * that was pressed included.
 *
 * Under a scope the theme arrives through React context instead, so each part
 * can be given it in its turn (`ThemeRelease`). Until its turn a part keeps
 * the theme it last drew, and it never goes back: a part moved later in the
 * order after it has changed (its page was left) stays changed.
 *
 * Keep scopes side by side, not one inside another. When a scope changes,
 * React runs every themed component under it again, the ones inside a nested
 * scope included, though theirs has not changed (see `use-theme-tokens`). One
 * scope round the whole app, with the screen in view scoped inside it, was
 * twice the work it looked like.
 *
 * Needs the patch to Uniwind's `useCSSVariable` (`patches/uniwind.patch`),
 * which upstream corrects from an effect after the fact: two passes per
 * change, the second one unable to wait.
 */
export function ThemeScope({ order, children }: ThemeScopeProps) {
  const release = React.useContext(ReleaseContext);
  const chosen = useThemeSetting();
  // Outside a `ThemeRelease` there are no turns to wait for.
  const theme = release?.theme ?? chosen;
  const reached = release === null || order <= release.through;

  // The theme this part last drew, which it keeps until its turn. Set while
  // rendering, the way React asks for state derived from what is passed in.
  const [drawn, setDrawn] = React.useState(theme);
  if (reached && drawn !== theme) setDrawn(theme);

  return (
    <ScopedTheme theme={reached ? theme : drawn}>
      {/* The shared tokens are read under the scope, so they are this part's. */}
      <ThemeTokensProvider>{children}</ThemeTokensProvider>
    </ScopedTheme>
  );
}
