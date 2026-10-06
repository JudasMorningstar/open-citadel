import React from 'react';
import { ScopedTheme } from 'uniwind';

import { ThemeTokensProvider } from '@/hooks/use-theme-tokens';
import { useThemeSetting } from '@/hooks/use-theme';

type ThemeScopeProps = {
  /**
   * This part of the app is what the reader is looking at when the theme is
   * changed, so it changes in the frame of the press. Everything else follows
   * as work React can put down for a press.
   */
  urgent?: boolean;
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
 * Under a scope the theme arrives through React context instead, so React can
 * give it to different parts at different priorities. The app as a whole takes
 * it as a deferred value: drawn in the background, in slices, and shown when
 * it is ready. The screen with the switch on it is `urgent` and takes it at
 * once, so the reader sees the press answered while the screens they cannot
 * see catch up.
 *
 * Needs the patch to Uniwind's `useCSSVariable` (`patches/uniwind.patch`),
 * which upstream corrects from an effect after the fact: two passes per
 * change, the second one unable to wait.
 */
export function ThemeScope({ urgent = false, children }: ThemeScopeProps) {
  const theme = useThemeSetting();
  const later = React.useDeferredValue(theme);

  return (
    <ScopedTheme theme={urgent ? theme : later}>
      {/* The shared tokens are read under the scope, so they are this part's. */}
      <ThemeTokensProvider>{children}</ThemeTokensProvider>
    </ScopedTheme>
  );
}
