import React from 'react';
import { useWindowDimensions, View } from 'react-native';

import { TransitionFlashList } from '@/components/navigation/transition-scroll';
import { LIST_DRAW_DISTANCE, MaxContentWidth, layout } from '@/constants/theme';
import { ShowTile } from '@/features/podcasts/components/show-tile';
import type { ShowTileData } from '@/features/podcasts/utils/show-tiles';

const GAP = 16;
const keyOf = (item: ShowTileData) => item.id;

type ShowGridProps = {
  tiles: ShowTileData[];
  empty: React.ReactElement;
  bottomPadding: number;
  onOpen: (id: string) => void;
};

/** Shows two to a row: the followed ones, or a genre's chart. On the screen's own list, so drag-to-close still works. */
export function ShowGrid({ tiles, empty, bottomPadding, onOpen }: ShowGridProps) {
  const { width } = useWindowDimensions();
  const tileWidth = (Math.min(width, MaxContentWidth) - layout.gutter * 2 - GAP) / 2;
  const renderItem = React.useCallback(
    ({ item, index }: { item: ShowTileData; index: number }) => {
      // FlashList has no column gap: each cell pads toward its neighbour by half of it.
      const left = index % 2 === 0;
      const cell = {
        paddingLeft: left ? layout.gutter : GAP / 2,
        paddingRight: left ? GAP / 2 : layout.gutter,
        paddingBottom: GAP,
      };
      return (
        <View style={cell}>
          <ShowTile
            id={item.id}
            title={item.title}
            author={item.author}
            artworkUrl={item.artworkUrl}
            newCount={item.newCount}
            following={item.following}
            width={tileWidth}
            onPress={onOpen}
          />
        </View>
      );
    },
    [onOpen, tileWidth],
  );

  return (
    <TransitionFlashList
      data={tiles}
      keyExtractor={keyOf}
      renderItem={renderItem}
      numColumns={2}
      drawDistance={LIST_DRAW_DISTANCE}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={empty}
    />
  );
}
