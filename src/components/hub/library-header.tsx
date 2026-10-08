import React from "react";
import { StyleSheet } from "react-native";
import { useCSSVariable } from "uniwind";

import { ChartNoAxesGantt, ZodiacPisces } from "@/components/icons";
import { ThemedView } from "@/components/themed-view";
import { ScreenHeader } from "@/components/ui/screen-header";
import { iconSize } from "@/constants/theme";
import { LibraryTabs } from "@/features/library/components/library-tabs";
import type { LibraryTab } from "@/stores/podcast-prefs";
import { asColor } from "@/utils/colors";

type LibraryHeaderProps = {
  tab: LibraryTab;
  onChangeTab: (tab: LibraryTab) => void;
  onOpenTimeline: () => void;
  onOpenSamwell: () => void;
};

/**
 * The Library's own ground and its header: the hub's map, with the Timeline
 * to one side, Samwell to the other, and the switch between its sides in the
 * middle.
 *
 * The ground is drawn here, behind everything, and not as a view wrapped
 * round the page: the sides are theme scopes of their own beside this one
 * (see `LibraryPage`), and a themed view round them would be a scope round
 * scopes.
 */
export function LibraryHeader({ tab, onChangeTab, onOpenTimeline, onOpenSamwell }: LibraryHeaderProps) {
  const [foreground, primary] = useCSSVariable(["--color-foreground", "--color-primary"]);
  return (
    <>
      <ThemedView style={StyleSheet.absoluteFill} pointerEvents="none" />
      <ScreenHeader
        title="Library"
        center={<LibraryTabs value={tab} onChange={onChangeTab} />}
        leftIcon={<ChartNoAxesGantt size={iconSize.default} color={asColor(foreground)} />}
        leftLabel="Timeline"
        onLeftPress={onOpenTimeline}
        // His mark carries the gold everywhere it appears, so the one control
        // on this header that is him reads as him.
        rightIcon={<ZodiacPisces size={iconSize.default} color={asColor(primary)} />}
        rightLabel="Samwell"
        onRightPress={onOpenSamwell}
      />
    </>
  );
}
