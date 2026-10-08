import React from 'react';
import { View } from 'react-native';

import { ChapterList, type ChapterRow } from '@/features/podcasts/components/chapter-list';
import { EpisodeSection } from '@/features/podcasts/components/episode-section';
import { ShowNotesView } from '@/features/podcasts/components/show-notes-view';
import type { NoteBlock } from '@/services/podcasts/show-notes';

type EpisodeDetailsProps = {
  chapters: ChapterRow[];
  notes: NoteBlock[];
  onSeek: (seconds: number) => void;
  onLink: (url: string) => void;
};

/**
 * What sits under an episode's hero: its chapters, then its show notes. The
 * heavy part of the page (notes can run to a few thousand words), so it is
 * the part that waits for the page to land.
 */
export function EpisodeDetails({ chapters, notes, onSeek, onLink }: EpisodeDetailsProps) {
  return (
    <View className="gap-8">
      {chapters.length > 0 ? (
        <EpisodeSection title="Chapters">
          <ChapterList chapters={chapters} onSelect={onSeek} />
        </EpisodeSection>
      ) : null}
      {notes.length > 0 ? (
        <EpisodeSection title="Show Notes">
          <ShowNotesView blocks={notes} onSeek={onSeek} onLink={onLink} />
        </EpisodeSection>
      ) : null}
    </View>
  );
}
