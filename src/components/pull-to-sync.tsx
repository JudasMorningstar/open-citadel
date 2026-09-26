import React from "react";
import {
    RefreshControl,
    ScrollView,
    View,
    type ScrollViewProps,
} from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

import { PageFade } from "@/components/scroll-fades";
import { usePullToSync, type PullLabels } from "@/hooks/use-pull-to-sync";
import { GAP } from "@/utils/pull-to-sync";

export type PullToSyncProps = Pick<
  ScrollViewProps,
  "contentContainerStyle" | "contentContainerClassName"
> & {
  /**
   * Whether a scan is going on, which is all this needs to hold the gap open.
   * A boolean and not the scan itself: the counters change several times a
   * second and the indicator reads them for itself.
   */
  running: boolean;
  /** Called once, on a release past `TRIGGER`. */
  onSync: () => void;
  /** What the gap says while it is being pulled. Defaults to the Library's. */
  labels?: PullLabels;
  /**
   * What the gap holds: the loader and a caption. Given the pull's own label
   * while it is being pulled, and `undefined` once the work is running, when
   * the indicator says what it is doing.
   */
  renderIndicator: (label: string | undefined) => React.ReactNode;
  children: React.ReactNode;
};

const SYNC_LABELS: PullLabels = { idle: "PULL TO SYNC", armed: "RELEASE TO SYNC" };

const GAP_BOX = { position: "absolute", top: -GAP, height: GAP } as const;

/**
 * A page's scroller, and the gap you pull open above it to start its work: a
 * scan of the books folder on the Library, a check for new episodes on
 * Podcasts. One gesture and one look for both.
 *
 * A scan started from anywhere else opens the same gap: the indicator has one
 * home on this screen, whether the scan came from a pull, from the launch
 * scan or from the button in All Books. The behaviour is `usePullToSync`'s.
 */
export function PullToSync({
  running,
  onSync,
  labels = SYNC_LABELS,
  renderIndicator,
  contentContainerStyle,
  contentContainerClassName,
  children,
}: PullToSyncProps) {
  const pull = usePullToSync(running, onSync, labels);
  const refreshControl = pull.usesNativeRefresh ? (
    <RefreshControl
      refreshing={pull.refreshing}
      onRefresh={pull.onNativeRefresh}
      tintColor="transparent"
    />
  ) : undefined;

  const scrollable = (
    <Animated.View style={pull.contentStyle} className="flex-1">
      <PageFade>
        <ScrollView
          className="flex-1"
          onScroll={pull.onScroll}
          contentContainerClassName={contentContainerClassName}
          contentContainerStyle={contentContainerStyle}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </PageFade>
    </Animated.View>
  );

  return (
    // Clips the strip parked above it, so nothing shows until it is pulled.
    <View className="flex-1 overflow-hidden">
      <Animated.View
        pointerEvents="none"
        style={[pull.gapStyle, GAP_BOX]}
        className="inset-x-0 items-center justify-center"
      >
        {renderIndicator(pull.label)}
      </Animated.View>
      {pull.usesNativeRefresh ? (
        scrollable
      ) : (
        <GestureDetector gesture={pull.pan}>{scrollable}</GestureDetector>
      )}
    </View>
  );
}
