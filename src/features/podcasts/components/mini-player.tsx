import React from 'react';
import { View } from 'react-native';
import Animated, { FadeOutDown, ReduceMotion, withTiming } from 'react-native-reanimated';
import { GestureDetector } from 'react-native-gesture-handler';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { easing, elevation, fontFamily, motion, spacing } from '@/constants/theme';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { MiniPlayerControls } from '@/features/podcasts/components/mini-player-controls';
import { MiniPlayerProgress } from '@/features/podcasts/components/mini-player-progress';
import { useDismissSwipe } from '@/features/podcasts/hooks/use-dismiss-swipe';
import type { NowPlaying } from '@/stores/podcast-player';
import { asColor } from '@/utils/colors';

/** The card's height, for the screens that keep room for it under their content. */
export const MINI_PLAYER_HEIGHT = 64;
/** Distance from the safe area's bottom edge to the card. */
export const MINI_PLAYER_GAP = spacing[3];
/** The room the card takes above the safe area: its height and the gap under it. */
export const MINI_PLAYER_CLEARANCE = MINI_PLAYER_HEIGHT + MINI_PLAYER_GAP;

const ART = 44;

/**
 * Rises from where the full player will come from, so the two read as one
 * object: the full player rises out of the bottom edge, and this is what is
 * left of it there. `slow` because it is an arrival, not feedback.
 */
function riseIn() {
  'worklet';
  const config = { duration: motion.slow, easing, reduceMotion: ReduceMotion.System };
  return {
    initialValues: { opacity: 0, transform: [{ translateY: 16 }] },
    animations: {
      opacity: withTiming(1, config),
      transform: [{ translateY: withTiming(0, config) }],
    },
  };
}
/** Screen readers get the swipe as an action. */
const DISMISS_ACTIONS = [{ name: 'dismiss', label: 'Close the player' }];

const SINK_OUT = FadeOutDown.duration(motion.base).reduceMotion(ReduceMotion.System);

export type MiniPlayerProps = {
  nowPlaying: NowPlaying;
  isPlaying: boolean;
  isBuffering: boolean;
  skipForwardSec: number;
  bottomInset: number;
  onOpen: () => void;
  onToggle: () => void;
  onSkipForward: () => void;
  /** Stops playback and puts the card away. */
  onClose: () => void;
};

/**
 * What is playing, on every podcast surface and on the Library.
 *
 * A floating card rather than a bar across the bottom: the app has no tab bar
 * for one to sit on, and the Library's own floating button and Samwell's
 * input card are already cards that float. Tapping it raises the full
 * player; the two controls on it are the two a listener reaches for without
 * looking: pause, and forward past an ad (or, once paused, close). Swiping it
 * down stops playback and puts it away.
 *
 * The listening progress is a gold hairline along the card's top edge
 * (`MiniPlayerProgress`), scaled on the UI thread, so a playing episode never
 * re-renders the screen under it.
 */
export function MiniPlayer({
  nowPlaying,
  isPlaying,
  isBuffering,
  skipForwardSec,
  bottomInset,
  onOpen,
  onToggle,
  onSkipForward,
  onClose,
}: MiniPlayerProps) {
  const [foreground, mutedForeground, surfaceTertiary] = useCSSVariable([
    '--color-foreground',
    '--color-muted-foreground',
    '--color-surface-tertiary',
  ]);
  const swipe = useDismissSwipe(onClose, MINI_PLAYER_CLEARANCE + bottomInset);

  return (
    <Animated.View
      entering={riseIn}
      exiting={SINK_OUT}
      className="absolute left-4 right-4"
      style={{ bottom: bottomInset + MINI_PLAYER_GAP }}
    >
      <GestureDetector gesture={swipe.gesture}>
        <Animated.View style={swipe.style}>
          <Touchable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`Now playing: ${nowPlaying.title}. Open the player.`}
            accessibilityActions={DISMISS_ACTIONS}
            onAccessibilityAction={onClose}
          >
            <View
              className="flex-row items-center gap-3 overflow-hidden border border-border bg-card pl-2.5 pr-1"
              style={[elevation.card, { height: MINI_PLAYER_HEIGHT }]}
            >
              <MiniPlayerProgress positionSec={nowPlaying.positionSec} durationSec={nowPlaying.durationSec} />
              <PodcastArtwork
                uri={nowPlaying.artworkUrl}
                size={ART}
                placeholderColor={asColor(surfaceTertiary)}
              />
              <View className="flex-1 gap-0.5">
                <ThemedText type="bodySm" numberOfLines={1} style={{ fontFamily: fontFamily.sansSemiBold }}>
                  {nowPlaying.title}
                </ThemedText>
                <ThemedText type="bodySm" color={asColor(mutedForeground)} numberOfLines={1} style={{ fontSize: 12, lineHeight: 16 }}>
                  {nowPlaying.showTitle}
                </ThemedText>
              </View>
              <MiniPlayerControls
                isPlaying={isPlaying}
                isBuffering={isBuffering}
                skipForwardSec={skipForwardSec}
                color={asColor(foreground)}
                onToggle={onToggle}
                onSkipForward={onSkipForward}
                onClose={onClose}
              />
            </View>
          </Touchable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
