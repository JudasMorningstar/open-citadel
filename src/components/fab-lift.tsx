import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fabPosition } from '@/components/fab-placement';
import { edgeSlide } from '@/constants/theme';
import { MINI_PLAYER_CLEARANCE } from '@/features/podcasts/components/mini-player';
import { useMiniPlayerClearance } from '@/features/podcasts/hooks/use-mini-player';

type FabLiftProps = {
  /** The button, placed with the position it is handed. */
  children: (position: ReturnType<typeof fabPosition>) => React.ReactNode;
};

/**
 * Carries a screen's floating button clear of the mini player, and moves it
 * with the card: up as the card slides in from the bottom edge, down as it
 * slides away, on the card's own timing, so the corner moves as one piece
 * instead of the button jumping when the card appears.
 *
 * The lift is a transform on this layer rather than a change to the button's
 * `bottom`, which would lay the screen out again on every frame. The layer
 * fills the screen and reaches one card's room below it, so a button's menu
 * backdrop still covers everything at either height; it passes every touch
 * through except the button's own. Because the layer starts that room below
 * the screen, the button is placed that much higher inside it, which puts it
 * where it sits with no card; the layer raises it by the card's room.
 */
export function FabLift({ children }: FabLiftProps) {
  const insets = useSafeAreaInsets();
  const clearance = useMiniPlayerClearance();
  // Where it is when the screen opens: no movement for what was already so.
  const lift = useSharedValue(clearance);

  // Before paint, in the same commit that mounts or removes the card, so the
  // two start on the same frame; a passive effect started it a few frames late.
  React.useLayoutEffect(() => {
    lift.set(withTiming(clearance, clearance > 0 ? edgeSlide.in : edgeSlide.out));
  }, [clearance, lift]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.get() }] }));
  const position = React.useMemo(() => fabPosition(insets.bottom + MINI_PLAYER_CLEARANCE), [insets.bottom]);

  return (
    <Animated.View pointerEvents="box-none" style={[styles.layer, style]}>
      {children(position)}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: -MINI_PLAYER_CLEARANCE },
});
