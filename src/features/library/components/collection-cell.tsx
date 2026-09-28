import React from 'react';

import { SquareLibrary } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { countLabel } from '@/utils/format';

type CollectionCellProps = {
  id: string;
  name: string;
  count: number;
  primary: string | undefined;
  onPress: (id: string) => void;
};

/**
 * One collection in the Collections grid. Memoized: a search keystroke
 * re-renders the screen, and cells whose name and count did not change skip
 * reflowing. Takes primitives and stable callbacks only.
 */
export const CollectionCell = React.memo(function CollectionCell({ id, name, count, primary, onPress }: CollectionCellProps) {
  const open = () => onPress(id);
  return (
    <Touchable className="flex-1" onPress={open}>
      {/* `flex-1` on the CARD, not only on the Touchable around it. The row
          stretches both Touchables to the taller of the two, but the card
          inside sizes to its own content unless it is told to fill, so a
          one-line name sat in a short card beside a two-line one. */}
      <Card className="flex-1 gap-2 p-5">
        <SquareLibrary size={22} color={primary} />
        {/* The name reserves both its lines whether or not it needs them, so
            cards match across ROWS too and not just within one. */}
        <ThemedText type="bodyMd" numberOfLines={2} className="flex-1">
          {name}
        </ThemedText>
        <ThemedText type="labelSm" color={primary}>
          {countLabel(count, 'BOOK')}
        </ThemedText>
      </Card>
    </Touchable>
  );
});
