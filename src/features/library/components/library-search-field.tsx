import React from 'react';
import { TextInput, View } from 'react-native';

import { Search, X } from '@/components/icons';
import { Touchable } from '@/components/ui/touchable';
import { contentColumn, fontFamily } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type LibrarySearchFieldProps = {
  value: string;
  onChange: (query: string) => void;
  placeholder: string;
};

/**
 * The search field at the top of a books list. Wrapped in the content column
 * because its own `mx-6` must stay inside the cap: a width and a margin on one
 * view would overflow it.
 */
export function LibrarySearchField({ value, onChange, placeholder }: LibrarySearchFieldProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const clear = () => onChange('');

  return (
    <View style={contentColumn}>
      <View className="mx-6 mb-5 flex-row items-center gap-3 border border-surface-tertiary bg-card px-4 py-3">
        <Search size={16} color={muted} />
        <TextInput
          className="flex-1 p-0 text-[14px] text-foreground"
          style={SANS}
          placeholder={placeholder}
          placeholderTextColor={muted}
          value={value}
          onChangeText={onChange}
          autoCorrect={false}
        />
        {value.length > 0 ? (
          <Touchable onPress={clear} accessibilityLabel="Clear search">
            <X size={16} color={muted} />
          </Touchable>
        ) : null}
      </View>
    </View>
  );
}

const SANS = { fontFamily: fontFamily.sans };
