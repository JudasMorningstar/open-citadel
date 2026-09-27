import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { ExternalLink } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { FreeBooksNotice } from '@/features/free-books/components/free-books-notice';
import type { BookFact } from '@/features/free-books/utils/book-facts';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export type FreeBookAboutProps = {
  summary: string | null;
  facts: BookFact[];
  /** The catalog's subject headings, as one line. */
  subjects: string | null;
  onOpenGutenberg: () => void;
};

/**
 * Everything under the button: the summary (Gutenberg marks its own as
 * automatically written, and that note is kept), the short facts (its
 * rights among them, in the catalog's words), the subjects, a way to its page on
 * Gutenberg, and where the book comes from.
 */
export function FreeBookAbout({ summary, facts, subjects, onOpenGutenberg }: FreeBookAboutProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const [expanded, setExpanded] = React.useState(false);
  const toggle = () => setExpanded((v) => !v);

  return (
    <View className="gap-6 pb-4">
      {summary ? (
        <Touchable onPress={toggle} className="px-6" accessibilityRole="button" accessibilityLabel={expanded ? 'Show less' : 'Show more'}>
          <ThemedText type="bodyMd" numberOfLines={expanded ? undefined : 5}>
            {summary}
          </ThemedText>
          <ThemedText type="labelSm" color={tokens['--color-primary']} className="mt-1">
            {expanded ? 'LESS' : 'MORE'}
          </ThemedText>
        </Touchable>
      ) : null}

      {facts.length > 0 ? (
        <View className="gap-2 px-6">
          {facts.map((fact) => (
            <View key={fact.label} className="flex-row justify-between gap-4">
              <ThemedText type="bodySm" color={muted}>
                {fact.label}
              </ThemedText>
              <ThemedText type="bodySm" className="flex-1 text-right">
                {fact.value}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      {subjects ? (
        <View className="gap-1 px-6">
          <ThemedText type="labelSm" color={muted}>
            SUBJECTS
          </ThemedText>
          <ThemedText type="bodySm">{subjects}</ThemedText>
        </View>
      ) : null}

      <View className="px-6">
        <ActionButton icon={ExternalLink} label="VIEW ON PROJECT GUTENBERG" onPress={onOpenGutenberg} tint={tokens['--color-primary']} centered className="h-11" />
      </View>

      <FreeBooksNotice />
    </View>
  );
}
