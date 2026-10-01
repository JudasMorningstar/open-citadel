import React from 'react';
import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

/**
 * The insights charts' placeholder, held up by `Sheet.DeferredRegion` while
 * the sheet rises: the rings card, the two stat cards, and the pace chart.
 *
 * The charts are the heaviest commit in Compass (SVG, and animated), and they
 * used to land *during* the sheet's own rise, competing with it for the UI
 * thread. The goal's card above them is plain and is drawn as the sheet
 * rises; only this part waits, and the sheet rises with something in it.
 *
 * Sound because insights opens with `snapRatios`, a fixed height: a
 * content-sized sheet (the planner, the log deck) would open to the
 * placeholder's height and jump when the real body arrived.
 *
 * One pulse per placeholder, never one per bar — see `SkeletonGroup`.
 */
export function InsightsChartsSkeleton() {
  return (
    <SkeletonGroup label="Loading insights" className="gap-4">
      <View className="items-center gap-3 border border-border bg-card p-4">
        <SkeletonBar className="h-3 w-28 self-start" />
        <SkeletonBar className="h-[190px] w-[190px]" />
        <SkeletonBar className="h-3 w-full" />
        <SkeletonBar className="h-3 w-full" />
      </View>
      <View className="flex-row gap-4">
        <SkeletonBar className="h-24 flex-1" />
        <SkeletonBar className="h-24 flex-1" />
      </View>
      <SkeletonBar className="h-44 w-full" />
    </SkeletonGroup>
  );
}

/**
 * The overview's category radar before the sheet has finished rising: its
 * card, label, chart and key, at their sizes. The main goal's card and the
 * side goals around it are plain and are drawn as the sheet rises; the radar
 * is an animated SVG chart and waits, so it is born still and plays then.
 */
export function RadarCardSkeleton() {
  return (
    <SkeletonGroup label="Loading the chart" className="gap-3 border border-border bg-card p-4">
      <SkeletonBar className="h-3 w-40" />
      <View className="items-center py-1">
        <SkeletonBar className="h-[168px] w-[168px]" />
      </View>
      <View className="flex-row justify-end">
        <SkeletonBar className="h-3 w-28" />
      </View>
    </SkeletonGroup>
  );
}

/**
 * The archive's list: a line of framing, then a stack of goal cards.
 *
 * Held for the sheet's rise like the others. This one is cheap to mount, but a
 * sheet that rises empty and then fills reads as slower than one that rises
 * with something in it, however fast the fill actually is.
 */
export function PastGoalsSkeleton() {
  return (
    <SkeletonGroup label="Loading past goals" className="gap-4 px-4 pb-6 pt-2">
      <SkeletonBar className="h-3 w-2/3" />
      <SkeletonBar className="h-24 w-full" />
      <SkeletonBar className="h-24 w-full" />
      <SkeletonBar className="h-24 w-full" />
    </SkeletonGroup>
  );
}
