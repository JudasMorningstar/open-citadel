import React from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import { useCSSVariable } from 'uniwind';

import { useCarouselState } from '@/components/ui/carousel';
import { Touchable } from '@/components/ui/touchable';
import { cn } from '@/lib/cn';

const DOT_WIDTH = 6;
const BAR_WIDTH = 18;

function VoiceCarouselDot({
  index,
  primaryColor,
  borderColor,
}: {
  index: number;
  primaryColor: string;
  borderColor: string;
}) {
  const { progress, index: active, scrollTo } = useCarouselState();
  const reducedMotion = useReducedMotion();

  const animated = useAnimatedStyle(() => {
    const distance = Math.abs(index - progress.value);
    if (reducedMotion) {
      const isActive = distance < 0.5;
      return {
        width: isActive ? BAR_WIDTH : DOT_WIDTH,
        backgroundColor: isActive ? primaryColor : borderColor,
      };
    }
    return {
      width: interpolate(distance, [0, 1], [BAR_WIDTH, DOT_WIDTH], Extrapolation.CLAMP),
      backgroundColor: interpolateColor(distance, [0, 1], [primaryColor, borderColor]),
    };
  });

  return (
    <Touchable
      onPress={() => scrollTo(index)}
      hitSlop={20}
      accessibilityRole="tab"
      accessibilityLabel={`Voice ${index + 1}`}
      accessibilityState={{ selected: active === index }}
    >
      <Animated.View className="h-1.5 rounded-none" style={animated} />
    </Touchable>
  );
}

export interface VoiceCarouselDotsProps extends ViewProps {
  className?: string;
}

/**
 * The carousel's page indicator: square dots, the active one widened into a
 * bar. Custom rather than the vendored `Carousel.Dots` — that one switches on
 * the settled index, and this needs `progress` continuously so the bar grows
 * and shrinks under the finger mid-drag, not just on release.
 */
export function VoiceCarouselDots({ className, ...props }: VoiceCarouselDotsProps) {
  const { count } = useCarouselState();
  const [primary, border] = useCSSVariable(['--color-primary', '--color-border']);
  const primaryColor = typeof primary === 'string' ? primary : '#B8861A';
  const borderColor = typeof border === 'string' ? border : 'rgba(0, 0, 0, 0.2)';

  if (count <= 1) return null;

  return (
    <View
      {...props}
      accessibilityRole="tablist"
      className={cn('flex-row items-center gap-1', className)}
    >
      {Array.from({ length: count }, (_unused, index) => (
        <VoiceCarouselDot key={index} index={index} primaryColor={primaryColor} borderColor={borderColor} />
      ))}
    </View>
  );
}
