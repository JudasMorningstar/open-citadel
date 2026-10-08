import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Lock, Rss } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Input } from '@/components/ui/input';
import { Sheet } from '@/components/ui/sheet';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import { asColor } from '@/utils/colors';

type AddBlogSheetProps = {
  visible: boolean;
  address: string;
  /** Changes on each opening: the field is uncontrolled and starts afresh from `address`. */
  fieldKey: string;
  finding: boolean;
  error: string | null;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * Following a blog by its address. The site's own address is enough: its
 * feed is found for you, so nobody needs to know what a feed is. Before,
 * during and after are all here: the field, the button's own spinner while
 * the feed is looked for, and what went wrong under the field if it did.
 */
export function AddBlogSheet({ visible, address, fieldKey, finding, error, onChange, onSubmit, onClose }: AddBlogSheetProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const destructive = asColor(useCSSVariable('--color-destructive'));
  const empty = address.trim().length === 0;

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-6 px-4 pb-2">
        <View className="gap-2">
          <ThemedText type="labelSm" color={muted}>
            FOLLOW A BLOG
          </ThemedText>
          <ThemedText type="headlineMd">Paste its address</ThemedText>
          <ThemedText type="bodySm" color={muted}>
            The blog&apos;s own address works. Its feed is found for you.
          </ThemedText>
        </View>
        <View className="gap-2">
          <Input
            key={fieldKey}
            placeholder="example.com"
            defaultValue={address}
            onChangeText={onChange}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            editable={!finding}
          />
          {error ? (
            <ThemedText type="bodySm" color={destructive}>
              {error}
            </ThemedText>
          ) : null}
        </View>
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <Lock size={16} color={muted} />
            <ThemedText type="bodySm" color={muted} className="flex-1">
              This phone fetches the blog straight from its site. Nothing goes through us.
            </ThemedText>
          </View>
          <GoldButton label="FOLLOW" icon={Rss} size="compact" onPress={onSubmit} loading={finding} disabled={empty} />
        </View>
      </View>
    </Sheet>
  );
}
