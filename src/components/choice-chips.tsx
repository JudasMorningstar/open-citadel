import React from 'react';
import { ScrollView, View } from 'react-native';

import { RowFade, type FadeSurface } from '@/components/scroll-fades';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { cn } from '@/lib/cn';
import { useThemeTokens } from '@/hooks/use-theme-tokens';


/** One option of a choice: the value it sets, and what it is called. */
export type Choice<T> = { value: T; label: string };

type ChoiceChipsProps<T> = {
  label?: string;
  /** A line under the label saying what the choice does. */
  hint?: string;
  choices: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  /** The ground the row sits on, so its fade blends. Sheets are `popover`. */
  surface?: FadeSurface;
  /** Horizontal inset: the sheet gutter by default, the page gutter on a screen, none inside a padded card. */
  gutter?: 'sheet' | 'page' | 'none';
};

/**
 * One setting, as a row of square chips: the chosen one lifted on a card with
 * its label in gold, the rest flat on the track. The same vocabulary as the
 * Library's switch and the chat / Compass switch, at the size of a label.
 *
 * Scrolls sideways when the choices run past the sheet, with the row fade
 * saying so.
 */
export function ChoiceChips<T extends string | number | null>({
  label,
  hint,
  choices,
  value,
  onChange,
  surface = 'popover',
  gutter = 'sheet',
}: ChoiceChipsProps<T>) {
  const pad = gutter === 'sheet' ? 'px-4' : gutter === 'page' ? 'px-6' : 'px-0';
  const tokens = useThemeTokens();
  return (
    <View className="gap-2">
      {label ? (
        <View className={cn('gap-0.5', pad)}>
          <ThemedText type="labelSm" color={tokens['--color-muted-foreground']}>
            {label}
          </ThemedText>
          {hint ? (
            <ThemedText type="bodySm" color={tokens['--color-muted-foreground']}>
              {hint}
            </ThemedText>
          ) : null}
        </View>
      ) : null}
      <RowFade surface={surface}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName={cn('gap-2', pad)}>
          {choices.map((choice) => {
            const selected = choice.value === value;
            return (
              <Touchable
                key={String(choice.value)}
                className={cn('min-h-10 justify-center border px-3.5', selected ? 'border-primary bg-card shadow-sm' : 'border-border bg-muted')}
                onPress={selected ? undefined : () => onChange(choice.value)}
                haptic="select"
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={choice.label}
              >
                <ThemedText type="labelSm" color={selected ? tokens['--color-primary'] : tokens['--color-foreground']}>
                  {choice.label}
                </ThemedText>
              </Touchable>
            );
          })}
        </ScrollView>
      </RowFade>
    </View>
  );
}
