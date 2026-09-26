import React from 'react';

import { useThemeTokens } from '@/hooks/use-theme-tokens';

/**
 * The colours a pull-to-refresh spinner takes: gold on the card surface, on
 * both platforms. Spread onto a `RefreshControl`.
 */
export function useRefreshTint() {
  const tokens = useThemeTokens();
  const primary = tokens['--color-primary'];
  const card = tokens['--color-card'];
  return React.useMemo(
    () => ({ tintColor: primary, colors: primary ? [primary] : undefined, progressBackgroundColor: card }),
    [primary, card],
  );
}
