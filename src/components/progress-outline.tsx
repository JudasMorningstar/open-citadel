import React from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, { ReduceMotion, useAnimatedProps, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Rect } from 'react-native-svg';

import { easing, motion } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const STROKE = 2;

type Size = { width: number; height: number };

type ProgressOutlineProps = {
  /** 0..1. Set it from anywhere; the stroke eases to each new value on the UI thread. */
  progress: SharedValue<number>;
  /** How far outside its parent the outline runs. 0 draws it on the parent's own edge. */
  outset?: number;
};

/**
 * A download's progress as a square outline filling in clockwise from the
 * top left, around whatever it is placed in: the app's progress mark, since
 * every other mark in it is square and a ring would be the one round thing.
 *
 * Sizes itself to its parent, so it wraps a 32pt icon box and a full-width
 * button alike. It takes a shared value rather than a number so a download
 * ticking never renders React: the page around it stays still.
 */
export function ProgressOutline({ progress, outset = 0 }: ProgressOutlineProps) {
  const [size, setSize] = React.useState<Size | null>(null);
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
  }, []);

  return (
    <View
      pointerEvents="none"
      onLayout={onLayout}
      style={{ position: 'absolute', top: -outset, left: -outset, right: -outset, bottom: -outset }}
    >
      {size ? <Outline key={`${size.width}x${size.height}`} size={size} progress={progress} /> : null}
    </View>
  );
}

/** The drawing, mounted once the size is known, so it never eases in from a zero-length path. */
function Outline({ size, progress }: { size: Size; progress: SharedValue<number> }) {
  const tokens = useThemeTokens();
  const width = size.width - STROKE;
  const height = size.height - STROKE;
  const perimeter = (width + height) * 2;
  const animatedProps = useAnimatedProps(() => {
    const fraction = Math.min(Math.max(progress.get(), 0), 1);
    return {
      strokeDashoffset: withTiming(perimeter * (1 - fraction), {
        duration: motion.slow,
        easing,
        reduceMotion: ReduceMotion.System,
      }),
    };
  });

  return (
    <Svg width={size.width} height={size.height}>
      <Rect x={STROKE / 2} y={STROKE / 2} width={width} height={height} stroke={tokens['--color-surface-tertiary']} strokeWidth={STROKE} fill="none" />
      <AnimatedRect
        x={STROKE / 2}
        y={STROKE / 2}
        width={width}
        height={height}
        stroke={tokens['--color-primary']}
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={[perimeter, perimeter]}
        strokeLinecap="butt"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
