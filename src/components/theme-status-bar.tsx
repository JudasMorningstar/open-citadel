import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { useThemeSetting } from '@/hooks/use-theme';

/**
 * The status bar's ink, set against the theme chosen.
 *
 * From the setting itself, not from the theme the root layout is drawn in: a
 * change is made on a screen that takes it with the press, and the clock over
 * that screen has to turn with it. A step later, with the rest of the app, it
 * was white on a light page for as long as the step took.
 */
export function ThemeStatusBar() {
  const theme = useThemeSetting();
  return <StatusBar style={theme === 'light' ? 'dark' : 'light'} />;
}
