import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import type { LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Item } from '@/components/ui/item';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { asColor } from '@/utils/colors';

/** How a row reads: plain, gold for the one thing it commits to, muted for undoing, red for destroying. */
export type MenuTone = 'plain' | 'gold' | 'muted' | 'destructive';

export type MenuRow<K extends string> = { key: K; label: string; tone?: MenuTone };

type MenuListProps<K extends string> = {
  rows: MenuRow<K>[];
  icons: Record<K, LucideIcon>;
  onSelect: (key: K) => void;
};

/**
 * The rows of an action sheet, one per thing that can be done.
 *
 * Menu density: the sheet shell hands over the whole gutter, so the rows own
 * it with `Item`'s own `p-4` (a 52dp row). It is left to the variant rather
 * than overridden per row because Uniwind resolves `p-*` over `px-*`/`py-*`
 * whatever the class order. The hairlines between rows are full-bleed, which
 * is what makes a run of them read as a menu rather than a list.
 */
export function MenuList<K extends string>({ rows, icons, onSelect }: MenuListProps<K>) {
  const tokens = useThemeTokens();
  const destructive = useCSSVariable('--color-destructive');
  const tones: Record<MenuTone, string | undefined> = {
    plain: tokens['--color-foreground'],
    gold: tokens['--color-primary'],
    muted: tokens['--color-muted-foreground'],
    destructive: asColor(destructive),
  };

  return (
    <Item.Group>
      {rows.map((row, index) => {
        const Icon: LucideIcon = icons[row.key];
        const color = tones[row.tone ?? 'plain'];
        return (
          <React.Fragment key={row.key}>
            {index > 0 ? <View className="h-px self-stretch bg-border" /> : null}
            <Item className="gap-4" onPress={() => onSelect(row.key)}>
              <Item.Media>
                <Icon size={20} color={color} />
              </Item.Media>
              <Item.Content>
                <ThemedText type="bodyMd" color={color}>
                  {row.label}
                </ThemedText>
              </Item.Content>
            </Item>
          </React.Fragment>
        );
      })}
    </Item.Group>
  );
}
