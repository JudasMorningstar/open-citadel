import React from 'react';
import { View } from 'react-native';

import { ChevronRight, type LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { iconSize } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type WelcomeChoiceProps = {
  icon: LucideIcon;
  title: string;
  /** What choosing it gets you, in one line. */
  detail: string;
  onPress: () => void;
};

/**
 * One way in, as a card to press rather than a button with a paragraph
 * under it: what it is, what it brings, and the chevron that says it leads
 * somewhere. Both ways sit side by side at the same weight, because neither
 * is the wrong answer.
 */
export function WelcomeChoice({ icon: Icon, title, detail, onPress }: WelcomeChoiceProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <Touchable onPress={onPress} haptic="select" accessibilityRole="button" accessibilityLabel={`${title}. ${detail}`}>
      <Card>
        <View className="flex-row items-center gap-4 p-4">
          <View className="h-10 w-10 items-center justify-center border border-border bg-muted">
            <Icon size={iconSize.default} color={tokens['--color-primary']} />
          </View>
          <View className="flex-1 gap-2">
            <ThemedText type="headlineSm">{title}</ThemedText>
            <ThemedText type="bodySm" color={muted}>
              {detail}
            </ThemedText>
          </View>
          <ChevronRight size={20} color={muted} />
        </View>
      </Card>
    </Touchable>
  );
}
