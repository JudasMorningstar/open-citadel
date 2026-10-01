import { View } from 'react-native';

import { SkeletonBar, SkeletonGroup } from '@/components/skeletons/skeleton-group';

/**
 * Stand-in for the part of Settings that mounts once the drawer has landed.
 *
 * Drawn in the Samwell section's own shape, a label-and-subtitle over two
 * side-by-side mode cards with a panel under them, not as generic rows: a
 * placeholder describing a screen this app does not have shows its mismatch
 * at exactly the moment it dissolves.
 */

/**
 * What every settings group is drawn on: the same `Card` surface the real
 * sections use. The placeholder had `muted` under Profile and `card` under the
 * other three, which is a shade the screen never shows and an unevenness that
 * only appears at the moment the placeholder dissolves into the real thing.
 */
const CARD = 'border border-border bg-card';

/** The gold letter-spaced group heading. */
function GroupLabel({ width = 'w-24' }: { width?: string }) {
  return <SkeletonBar className={`h-3 ${width}`} />;
}

function Divider() {
  return <View className="h-px bg-surface-tertiary mt-4" />;
}

/** One of the two Samwell mode cards: icon and title, then a wrapped blurb. */
function ModeCardSkeleton() {
  return (
    <View className={`${CARD} flex-1 gap-2 p-4`}>
      <View className="flex-row items-center gap-3">
        <SkeletonBar className="h-9 w-9 rounded" />
        <SkeletonBar className="h-3.5 w-14" />
      </View>
      <SkeletonBar className="h-3 w-full" />
      <SkeletonBar className="h-3 w-3/5" />
    </View>
  );
}

/**
 * Settings below its first screenful, before the page has landed: the Samwell
 * section, which is the first thing under the fold and the one a reader
 * scrolling straight down meets. Profile, Appearance and Books above it are
 * drawn from the first frame.
 */
export function SettingsSkeleton() {
  return (
    <SkeletonGroup label="Loading settings">
      {/* SAMWELL — label over a subtitle, then the two mode cards side by side,
          then the engine panel beneath them. */}
      <Divider />
      <View className="mt-8 gap-4">
        <View className="gap-1">
          <GroupLabel width="w-40" />
          <SkeletonBar className="h-3 w-32" />
        </View>
        <View className="flex-row gap-3">
          <ModeCardSkeleton />
          <ModeCardSkeleton />
        </View>
        <View className={`${CARD} gap-3 p-4`}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <SkeletonBar className="h-3.5 w-2/3" />
              <SkeletonBar className="h-3 w-2/5" />
            </View>
            <SkeletonBar className="h-8 w-20" />
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}
