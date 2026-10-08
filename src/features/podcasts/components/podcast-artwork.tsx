import React from 'react';

import { MicSignal } from '@/components/icons';
import { SquareArtwork } from '@/components/square-artwork';

type PodcastArtworkProps = Omit<React.ComponentProps<typeof SquareArtwork>, 'fallbackIcon'>;

/** A show's or an episode's artwork, with the microphone when it has none. */
export function PodcastArtwork(props: PodcastArtworkProps) {
  return <SquareArtwork fallbackIcon={MicSignal} {...props} />;
}
