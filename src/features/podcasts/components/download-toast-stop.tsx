import React from 'react';

import { Touchable } from '@/components/ui/touchable';
import { DownloadRing } from '@/features/podcasts/components/download-ring';

const RING = 28;

type DownloadToastStopProps = {
  episodeId: string;
  title: string;
  onStop: () => void;
};

/** A download toast's one control: its progress, and the stop in the middle of it. */
export function DownloadToastStop({ episodeId, title, onStop }: DownloadToastStopProps) {
  return (
    <Touchable
      hitSlop={8}
      haptic="tap"
      onPress={onStop}
      accessibilityRole="button"
      accessibilityLabel={`Stop downloading ${title}`}
    >
      <DownloadRing episodeId={episodeId} size={RING} />
    </Touchable>
  );
}
