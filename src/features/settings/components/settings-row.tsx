import React from 'react';
import { View } from 'react-native';

import { ChevronRight, ChevronUp, type LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { PrefixIcon } from '@/components/ui/prefix-icon';
import { Touchable } from '@/components/ui/touchable';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type SettingsRowProps = {
  icon: LucideIcon;
  title: string;
  /** What is set right now, in one line. */
  detail?: string;
  /**
   * Where a press goes, which picks the mark at the row's end: a page slides
   * in from the side, a sheet rises from below. Ignored with `accessory`.
   */
  opens?: 'page' | 'sheet';
  /** A control drawn in the mark's place, for a row that is its own setting. */
  accessory?: React.ReactNode;
  onPress: () => void;
};

/**
 * One row of the Settings root: what it is, what it is set to, and a mark
 * saying where a press leads. The state is the point. Someone opening
 * Settings is usually checking something, and a row that already says
 * "On-device · Qwen 3 1.7B" has answered before they go any deeper.
 */
export function SettingsRow({ icon, title, detail, opens = 'page', accessory, onPress }: SettingsRowProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const Mark = opens === 'sheet' ? ChevronUp : ChevronRight;
  const label = detail ? `${title}. ${detail}` : title;

  return (
    <Touchable onPress={onPress} haptic="select" accessibilityRole="button" accessibilityLabel={label}>
      <Card className="flex-row items-center gap-3 p-4">
        <PrefixIcon icon={icon} size={40} color={tokens['--color-primary']} />
        <View className="flex-1 gap-0.5">
          <ThemedText type="bodyMd" numberOfLines={1}>
            {title}
          </ThemedText>
          {detail ? (
            <ThemedText type="bodySm" color={muted} numberOfLines={1}>
              {detail}
            </ThemedText>
          ) : null}
        </View>
        {accessory ?? <Mark size={18} color={muted} />}
      </Card>
    </Touchable>
  );
}
