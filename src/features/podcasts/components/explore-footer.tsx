import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { Import } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

/**
 * The foot of Explore: the other two ways in. Bringing a library across, and
 * a reminder that any show's feed or its link can be pasted into
 * the search, for the show that is on no chart.
 */
export function ExploreFooter({ onImport }: { onImport: () => void }) {
  const tokens = useThemeTokens();
  return (
    <View className="gap-4 px-6 pb-4">
      <ThemedText type="headlineSm">Have a show in mind?</ThemedText>
      <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
        Paste its feed address or a link to it into the search above. Coming from
        AntennaPod? Bring your whole library across, with everything you have listened to.
      </ThemedText>
      <ActionButton icon={Import} label="IMPORT FROM ANTENNAPOD" onPress={onImport} tint={tokens['--color-primary']} centered className="h-12" />
    </View>
  );
}
