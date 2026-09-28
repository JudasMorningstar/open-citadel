import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { formatClock } from '@/features/podcasts/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

export type ChapterRow = { id: string; startSec: number; title: string };

type ChapterListProps = {
  chapters: ChapterRow[];
  /** The chapter playing now, drawn in gold. */
  currentId?: string | null;
  onSelect: (startSec: number) => void;
};

/** An episode's chapters: where each starts and what it is. Pressing one plays from there. */
export function ChapterList({ chapters, currentId, onSelect }: ChapterListProps) {
  const tokens = useThemeTokens();
  return (
    <View>
      {chapters.map((chapter, i) => {
        const current = chapter.id === currentId;
        return (
          <React.Fragment key={chapter.id}>
            {i > 0 ? <View className="h-px bg-border" /> : null}
            <Touchable
              className="flex-row items-baseline gap-4 py-3"
              onPress={() => onSelect(chapter.startSec)}
              accessibilityRole="button"
              accessibilityLabel={`Play from ${chapter.title}`}
            >
              <ThemedText
                type="labelSm"
                color={current ? tokens['--color-primary'] : tokens['--color-muted-foreground']}
                style={{ width: 56, fontVariant: ['tabular-nums'] }}
              >
                {formatClock(chapter.startSec)}
              </ThemedText>
              <ThemedText type="bodyMd" color={current ? tokens['--color-primary'] : undefined} className="flex-1" numberOfLines={2}>
                {chapter.title}
              </ThemedText>
            </Touchable>
          </React.Fragment>
        );
      })}
    </View>
  );
}
