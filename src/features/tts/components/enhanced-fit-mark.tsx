import React from 'react';
import { useCSSVariable } from 'uniwind';

import { CircleAlert, CircleCheck } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { enhancedFitCopy, type EnhancedFit } from '@/features/tts/utils/enhanced-fit';
import { asColor } from '@/utils/colors';

export interface EnhancedFitMarkProps {
  fit: EnhancedFit;
  /** Opens the sheet that says what the mark means. */
  onPress: () => void;
}

/**
 * How this phone will cope with the Enhanced voices, in one line beside what
 * they are: a ringed green tick where they run smoothly, a ringed warning
 * where they will pause. Pressing it says why, and what to do.
 *
 * Status is said by the mark and the words together, never by colour alone.
 */
export function EnhancedFitMark({ fit, onPress }: EnhancedFitMarkProps) {
  const [success, warning] = useCSSVariable(['--color-success-foreground', '--color-warning-foreground']);
  const smooth = fit === 'smooth';
  const color = asColor(smooth ? success : warning);
  const Icon = smooth ? CircleCheck : CircleAlert;
  const copy = enhancedFitCopy(fit);

  return (
    <Touchable
      className="flex-row items-center gap-1.5"
      onPress={onPress}
      haptic="tap"
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={copy.mark}
      accessibilityHint="Says how these voices will run on this phone"
    >
      <Icon size={16} color={color} strokeWidth={2} />
      <ThemedText type="bodySm" color={color}>
        {copy.mark}
      </ThemedText>
    </Touchable>
  );
}
