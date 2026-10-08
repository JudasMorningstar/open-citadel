import React from 'react';

import { FeedTile } from '@/components/feed-tile';
import { Newspaper } from '@/components/icons';
import { monogramOf } from '@/utils/monogram';

type BlogTileProps = Omit<React.ComponentProps<typeof FeedTile>, 'fallbackIcon' | 'monogram'>;

/** A blog on a shelf or in a grid: its picture, or its initials in the serif when it has none. */
export const BlogTile = React.memo(function BlogTile(props: BlogTileProps) {
  return <FeedTile fallbackIcon={Newspaper} monogram={monogramOf(props.title)} {...props} />;
});
