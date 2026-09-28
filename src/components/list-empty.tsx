import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spinner } from '@/components/ui/spinner';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ListEmptyProps = {
  /** Still looking: a spinner in place of the message. */
  loading?: boolean;
  /** Why the list is empty. Nothing is drawn without one. */
  text: string | null;
};

/** What a list shows when it has no rows: that it is still loading, or why it is empty. */
export function ListEmpty({ loading = false, text }: ListEmptyProps) {
  const tokens = useThemeTokens();
  if (loading) {
    return (
      <View className="items-center py-12">
        <Spinner />
      </View>
    );
  }
  if (!text) return null;
  return (
    <ThemedText type="bodySm" color={tokens['--color-muted-foreground']} className="px-6 py-8">
      {text}
    </ThemedText>
  );
}
