import React from 'react';
import { View, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { fontFamily, type TypographyVariant } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { NoteBlock, NoteSpan } from '@/services/podcasts/show-notes';

type ShowNotesViewProps = {
  blocks: NoteBlock[];
  onSeek: (seconds: number) => void;
  onLink: (url: string) => void;
};

/** Long-form reading size, a step under the reader's own. */
const BODY: TextStyle = { fontSize: 17, lineHeight: 27 };
const BOLD: TextStyle = { fontFamily: fontFamily.sansBold };
const ITALIC: TextStyle = { fontStyle: 'italic' };
const UNDERLINE: TextStyle = { textDecorationLine: 'underline' };

/** One run of text: its colour, weight and what pressing it does. */
function Span({
  span,
  type,
  gold,
  onSeek,
  onLink,
}: {
  span: NoteSpan;
  type: TypographyVariant;
  gold: string | undefined;
  onSeek: (seconds: number) => void;
  onLink: (url: string) => void;
}) {
  const seekSec = span.seekSec;
  const href = span.href;
  const pressable = seekSec != null || href != null;
  const style = [type === 'bodyLg' ? BODY : undefined, span.bold && BOLD, span.italic && ITALIC, seekSec != null && UNDERLINE];
  const onPress = seekSec != null ? () => onSeek(seekSec) : href ? () => onLink(href) : undefined;
  return (
    <ThemedText type={type} color={pressable ? gold : undefined} style={style} onPress={onPress}>
      {span.text}
    </ThemedText>
  );
}

/**
 * Show notes, set in the house reading type rather than a web view.
 *
 * Links are gold and open outside the app; timestamps are gold and underlined
 * and jump the episode there, which turns a guest list or a rundown in the
 * notes into a way around the episode. Headings take the library's serif, and
 * list items the square bullet every mark in the app shares.
 */
export function ShowNotesView({ blocks, onSeek, onLink }: ShowNotesViewProps) {
  const tokens = useThemeTokens();
  const gold = tokens['--color-primary'];

  return (
    <View className="gap-4">
      {blocks.map((block, i) => {
        const type: TypographyVariant = block.kind === 'heading' ? 'headlineSm' : 'bodyLg';
        const text = (
          <ThemedText type={type} style={type === 'bodyLg' ? BODY : undefined} className={block.kind === 'item' ? 'flex-1' : undefined}>
            {block.spans.map((span, j) => (
              <Span key={j} span={span} type={type} gold={gold} onSeek={onSeek} onLink={onLink} />
            ))}
          </ThemedText>
        );
        return block.kind === 'item' ? (
          <View key={i} className="flex-row gap-3 pl-1">
            <View className="mt-[11px] h-1.5 w-1.5 bg-primary" />
            {text}
          </View>
        ) : (
          <View key={i}>{text}</View>
        );
      })}
    </View>
  );
}
