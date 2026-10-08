import React from 'react';
import { View } from 'react-native';

import { RowSeparator } from '@/components/row-separator';
import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

const ROWS = [0, 1, 2, 3, 4];

/**
 * A list of posts before it has landed: rows the height of real ones (the
 * picture beside meta and title, the summary, the menu row), in one
 * `SkeletonGroup` so the list pulses as one node.
 */
export function ArticleListSkeleton() {
  return (
    <SkeletonGroup label="Loading posts">
      {ROWS.map((i) => (
        <View key={i}>
          {i > 0 ? <RowSeparator /> : null}
          <View className="gap-3 px-6 py-5">
            <View className="flex-row gap-3">
              <View className="bg-skeleton" style={{ width: 56, height: 56 }} />
              <View className="flex-1 gap-2">
                <SkeletonBar className="h-2.5 w-2/5" />
                <SkeletonBar className="h-4 w-11/12" />
                <SkeletonBar className="h-4 w-3/5" />
              </View>
            </View>
            <SkeletonBar className="h-3 w-4/5" />
            <View className="h-10" />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
