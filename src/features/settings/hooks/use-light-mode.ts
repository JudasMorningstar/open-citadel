import React from 'react';

import { useThemeMode } from '@/hooks/use-theme';

/** The light switch, moved on the press rather than once the theme has landed. */
export function useLightMode() {
  const { mode, setMode } = useThemeMode();
  // Local, so the thumb moves on the frame of the press, ahead of the store
  // write and the theme-token cascade (see `app/_layout.tsx`). `mode` is the
  // truth and takes this back the moment it catches up.
  const [light, setLight] = React.useState(mode === 'light');
  // State following the theme, set while rendering: when it moves, so does this.
  const [seen, setSeen] = React.useState(mode);
  if (seen !== mode) {
    setSeen(mode);
    setLight(mode === 'light');
  }

  const onLightChange = React.useCallback(
    (next: boolean) => {
      setLight(next);
      setMode(next ? 'light' : 'dark');
    },
    [setMode],
  );
  return { light, onLightChange };
}
