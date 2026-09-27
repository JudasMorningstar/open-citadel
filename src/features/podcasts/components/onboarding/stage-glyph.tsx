import React from 'react';
import Animated from 'react-native-reanimated';

import type { LucideIcon } from '@/components/icons';
import { Card } from '@/components/ui/card';
import { iconSize, motion, popIn } from '@/constants/theme';

const BOX = 64;

type StageGlyphProps = {
  icon: LucideIcon;
  color: string | undefined;
};

/**
 * The mark a step of getting started opens with: a hero icon set in a square
 * card, the way an app's own icon sits on its tile. It arrives first and in
 * place, and the words follow it in.
 */
export function StageGlyph({ icon: Icon, color }: StageGlyphProps) {
  return (
    <Animated.View entering={popIn(motion.base)}>
      <Card className="items-center justify-center" style={{ width: BOX, height: BOX }}>
        <Icon size={iconSize.hero} color={color} />
      </Card>
    </Animated.View>
  );
}
