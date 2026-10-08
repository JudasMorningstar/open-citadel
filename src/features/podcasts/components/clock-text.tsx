import React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';

import { typography } from '@/constants/theme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

type ClockTextProps = {
  text: SharedValue<string>;
  color: string | undefined;
  align: 'left' | 'right';
};

/**
 * A clock label that updates on the UI thread. A read-only TextInput is the
 * one text node whose content can be set from a worklet, so scrubbing never
 * renders React at all, however fast the finger moves.
 */
export function ClockText({ text, color, align }: ClockTextProps) {
  const animatedProps = useAnimatedProps(() => ({ text: text.get(), defaultValue: text.get() }) as Partial<TextInputProps>);
  return (
    <AnimatedTextInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      style={[typography.labelSm, { color, textAlign: align, padding: 0, fontVariant: ['tabular-nums'], minWidth: 64 }]}
    />
  );
}
