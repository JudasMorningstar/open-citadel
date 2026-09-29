import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ActionButton } from '@/components/action-button';
import { RefreshCw } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { asColor } from '@/utils/colors';

/**
 * The plan run when the store would not give its prices, even after retries:
 * what went wrong in plain words, and the way to ask again beside it. Never a
 * run of cards with prices that are not coming.
 */
export function PlanOfferFailed({ onRetry }: { onRetry?: () => void }) {
  const mutedForeground = asColor(useCSSVariable('--color-muted-foreground'));
  return (
    <View className="flex-row items-center justify-between gap-3">
      <ThemedText type="bodySm" color={mutedForeground} className="flex-1">
        The plans could not be loaded. Check your connection and try again.
      </ThemedText>
      <ActionButton
        icon={RefreshCw}
        label="TRY AGAIN"
        tint={mutedForeground}
        onPress={() => onRetry?.()}
      />
    </View>
  );
}
