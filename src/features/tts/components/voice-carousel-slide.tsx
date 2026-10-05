import React from 'react';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';

import { Carousel, useCarouselState } from '@/components/ui/carousel';
import { VoiceCarouselCard, type VoiceCarouselCardProps } from '@/features/tts/components/voice-carousel-card';

const REST_SCALE = 1;
const AWAY_SCALE = 0.92;
const REST_OPACITY = 1;
const AWAY_OPACITY = 0.45;

export type VoiceCarouselSlideProps = Omit<VoiceCarouselCardProps, 'onSelect'> & {
  /**
   * Hold the slide's place without drawing its card: for the slides out of
   * view while the run is being built in the frame of a press. See `full` on
   * `VoiceCarousel`.
   */
  bare?: boolean;
};

/**
 * The run's `scrollTo`, under one identity for the slide's whole life. The
 * carousel hands out a new one each time it settles, which would otherwise
 * redraw every card for a function that does the same thing.
 */
function useSelect(scrollTo: (index: number) => void) {
  const latest = React.useRef(scrollTo);
  React.useEffect(() => {
    latest.current = scrollTo;
  }, [scrollTo]);
  return React.useCallback((index: number) => latest.current(index), []);
}

/**
 * One slide of the voice run, with depth — mirrors `PlanSlide`: the
 * carousel's `default` variant is a plain track, so scale and opacity here
 * are what makes the centred card read as the one being chosen rather than
 * one of several equal photographs.
 *
 * Also where "tap a side card to select it" lives, since `scrollTo` only
 * exists inside the `<Carousel>` tree this renders into — the host component
 * that lays out `<Carousel>` itself sits one level above that context.
 */
export function VoiceCarouselSlide({ index, bare = false, ...card }: VoiceCarouselSlideProps) {
  const { progress, scrollTo } = useCarouselState();
  const select = useSelect(scrollTo);
  const reducedMotion = useReducedMotion();

  const animated = useAnimatedStyle(() => {
    const distance = Math.abs(index - progress.value);
    if (reducedMotion) {
      const away = distance > 0.5;
      return {
        opacity: away ? AWAY_OPACITY : REST_OPACITY,
        transform: [{ scale: away ? AWAY_SCALE : REST_SCALE }],
      };
    }
    return {
      opacity: interpolate(distance, [0, 1], [REST_OPACITY, AWAY_OPACITY], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(distance, [0, 1], [REST_SCALE, AWAY_SCALE], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <Carousel.Item className="px-1.5">
      <Animated.View className="h-full w-full" style={animated}>
        {bare ? null : <VoiceCarouselCard {...card} index={index} onSelect={select} />}
      </Animated.View>
    </Carousel.Item>
  );
}
