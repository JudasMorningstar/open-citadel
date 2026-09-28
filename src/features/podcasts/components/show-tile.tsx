import React from 'react';

import { FeedTile } from '@/components/feed-tile';
import { MicSignal } from '@/components/icons';

type ShowTileProps = Omit<React.ComponentProps<typeof FeedTile>, 'fallbackIcon'>;

/** A show on a shelf or in a grid, with the microphone when it has no artwork. */
export const ShowTile = React.memo(function ShowTile(props: ShowTileProps) {
  return <FeedTile fallbackIcon={MicSignal} {...props} />;
});
