import React from 'react';
import { View } from 'react-native';

import { PageFade } from '@/components/scroll-fades';
import { ThemedText } from '@/components/themed-text';
import { Sheet } from '@/components/ui/sheet';
import { ChapterList, type ChapterRow } from '@/features/podcasts/components/chapter-list';

type ChaptersSheetProps = {
  visible: boolean;
  chapters: ChapterRow[];
  currentId: string | null;
  onClose: () => void;
  onSelect: (startSec: number) => void;
};

/** The episode's chapters from the player, the one playing in gold. */
export function ChaptersSheet({ visible, chapters, currentId, onClose, onSelect }: ChaptersSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} scrollable maxHeightRatio={0.8}>
      <PageFade edges="both" surface="popover">
        <Sheet.ScrollView contentContainerClassName="px-4 pb-4">
          <ThemedText type="headlineSm" className="pb-2">
            Chapters
          </ThemedText>
          <View>
            <ChapterList
              chapters={chapters}
              currentId={currentId}
              onSelect={(start) => {
                onSelect(start);
                onClose();
              }}
            />
          </View>
        </Sheet.ScrollView>
      </PageFade>
    </Sheet>
  );
}
