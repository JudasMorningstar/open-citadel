import React from 'react';
import { View } from 'react-native';

import { Smartphone, Sparkles } from '@/components/icons';
import { ModeCard } from '@/components/mode-card';
import type { VoiceMode } from '@/services/device-tts/catalogue';

export interface TtsModeCardsProps {
  mode: VoiceMode;
  /** Whether this phone can run the AI voices at all. */
  aiSupported: boolean;
  aiDownloaded: boolean;
  onSelectAi: () => void;
  onSelectNative: () => void;
}

/**
 * The two ways to be read to, side by side. Each says what it is in plain
 * words and what state it is in, so the choice makes sense without knowing
 * what "native" means.
 */
export function TtsModeCards({ mode, aiSupported, aiDownloaded, onSelectAi, onSelectNative }: TtsModeCardsProps) {
  const aiDescription = aiSupported
    ? 'Natural voices that read offline.'
    : 'Needs more memory than this phone has.';
  const aiStatus = !aiSupported ? 'NOT AVAILABLE' : aiDownloaded ? 'READY' : 'DOWNLOAD NEEDED';

  return (
    <View className="flex-row gap-3" accessibilityRole="radiogroup">
      <ModeCard
        active={mode === 'ai'}
        icon={Sparkles}
        label="AI voices"
        description={aiDescription}
        status={aiStatus}
        disabled={!aiSupported}
        compact
        onSelect={onSelectAi}
      />
      <ModeCard
        active={mode === 'native'}
        icon={Smartphone}
        label="Phone voices"
        description="Built into your phone."
        status="READY"
        compact
        onSelect={onSelectNative}
      />
    </View>
  );
}
