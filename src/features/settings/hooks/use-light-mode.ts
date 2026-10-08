import React from 'react';

import { setThemeSetting, useThemeSetting } from '@/hooks/use-theme';

/**
 * The light switch, read from the setting and not from the theme drawn.
 *
 * The setting changes in the press itself, so the thumb moves on that frame.
 * The theme drawn is handed out by `ThemeScope`, and the part of the app this
 * hook is called from takes it a beat later: read from there, the switch
 * needed a local copy to stay ahead, and two quick presses could show the
 * thumb the first one's answer after the second.
 */
export function useLightMode() {
  const light = useThemeSetting() === 'light';
  const onLightChange = React.useCallback((next: boolean) => setThemeSetting(next ? 'light' : 'dark'), []);
  return { light, onLightChange };
}
