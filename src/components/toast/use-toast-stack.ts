import React from 'react';
import type { LayoutChangeEvent } from 'react-native';
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { stackPlacement } from '@/utils/toast-stack';

const FADE_MS = 200;
/** How far the front card has to be lifted before the words behind it are fully shown. */
const REVEAL_DRAG = 48;

type ToastStackOptions = {
  id: number;
  index: number;
  frontHeight: number;
  spread: boolean;
  spreadOffset: number;
  reduced: boolean;
  /** Set once the card starts leaving: it keeps where it was rather than rejoin the pile. */
  exiting: React.RefObject<boolean>;
  opacity: SharedValue<number>;
  /** How far the front card is being dragged, so the card behind can show what it says. */
  frontDrag: SharedValue<number>;
  onHeight: (id: number, height: number) => void;
};

/**
 * One card's place in the pile, moved there on the UI thread whenever the
 * pile changes: its depth, the front card's height, or the pile spreading
 * into a column. See `utils/toast-stack` for where that is.
 */
export function useToastStack({
  id,
  index,
  frontHeight,
  spread,
  spreadOffset,
  reduced,
  exiting,
  opacity,
  frontDrag,
  onHeight,
}: ToastStackOptions) {
  const [height, setHeight] = React.useState(0);
  const first = stackPlacement({ index, height: 0, frontHeight, spread, spreadOffset });
  const stackY = useSharedValue(first.y);
  const stackScale = useSharedValue(first.scale);
  const contentOpacity = useSharedValue(first.contentVisible ? 1 : 0);

  React.useEffect(() => {
    if (exiting.current) return;
    const place = stackPlacement({ index, height, frontHeight, spread, spreadOffset });
    stackY.set(reduced ? place.y : withSpring(place.y));
    stackScale.set(reduced ? place.scale : withSpring(place.scale));
    contentOpacity.set(withTiming(place.contentVisible ? 1 : 0, { duration: FADE_MS }));
    opacity.set(withTiming(place.visible ? 1 : 0, { duration: FADE_MS }));
  }, [index, height, frontHeight, spread, spreadOffset, reduced, exiting, stackY, stackScale, contentOpacity, opacity]);

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const next = Math.round(event.nativeEvent.layout.height);
      setHeight(next);
      onHeight(id, next);
    },
    [id, onHeight],
  );

  // A collapsed card behind shows only its edge, until the front one is lifted
  // off it: then its words come up with the lift, rather than an empty card.
  const behind = index > 0 && !spread;
  const contentStyle = useAnimatedStyle(() => {
    const own = contentOpacity.get();
    if (!behind) return { opacity: own };
    const lifted = interpolate(-frontDrag.get(), [0, REVEAL_DRAG], [0, 1], Extrapolation.CLAMP);
    return { opacity: Math.max(own, lifted) };
  });

  return { stackY, stackScale, contentStyle, onLayout };
}
