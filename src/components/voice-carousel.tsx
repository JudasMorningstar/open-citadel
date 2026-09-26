import React, { useState } from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { Carousel } from '@/components/ui/carousel';
import { useVoicePreview } from '@/components/use-voice-preview';
import { VoiceCarouselDots } from '@/components/voice-carousel-dots';
import { VoiceCarouselSlide } from '@/components/voice-carousel-slide';
import { KOKORO_EN_US_VOICES, resolveVoice } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';
import { useTtsStore } from '@/stores/tts';
import { asColor } from '@/utils/colors';
import { haptics } from '@/utils/haptics';
import { cn } from '@/lib/cn';

const CARD_WIDTH = 240;
const CARD_HEIGHT = 156;
const CARD_GAP = 12;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;

/**
 * The Kokoro voice roster as a snapping carousel: one voice centred at a
 * time, its neighbours peeking in at each edge. See `VoiceCarouselSlide`/
 * `VoiceCarouselCard` for the per-card content and depth, and
 * `VoiceCarouselDots` for the page indicator.
 *
 * Self-contained and prop-free, like `TtsSettingsPanel` that hosts it — reads
 * and writes `useSettingsStore`/`useTtsStore` directly.
 */
export function VoiceCarousel() {
  const mutedForeground = useCSSVariable('--color-muted-foreground');

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const isDownloaded = useTtsStore((s) => s.isDownloaded);
  const { previewingVoice, preview, stop: stopPreview } = useVoicePreview();

  const initialIndex = KOKORO_EN_US_VOICES.indexOf(resolveVoice(ttsVoice));
  const [active, setActive] = useState(initialIndex);

  const handleIndexChange = (next: number) => {
    setActive(next);
    setTtsVoice(KOKORO_EN_US_VOICES[next]);
    // A new card arriving mid-preview would keep the old voice's sample
    // playing under the new one's now-selected controls.
    stopPreview();
    haptics.select();
  };

  return (
    <View className={cn('gap-2', !isDownloaded && 'opacity-50')}>
      <View className="flex-row items-baseline justify-between">
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>
          READING VOICE
        </ThemedText>
        <ThemedText type="labelSm" color={asColor(mutedForeground)}>
          {active + 1} / {KOKORO_EN_US_VOICES.length}
        </ThemedText>
      </View>

      <Carousel
        variant="default"
        align="center"
        itemSize={ITEM_SIZE}
        defaultIndex={initialIndex}
        onIndexChange={handleIndexChange}
        scrollEnabled={isDownloaded}
      >
        <Carousel.Content style={{ height: CARD_HEIGHT }}>
          {KOKORO_EN_US_VOICES.map((voice, index) => (
            <VoiceCarouselSlide
              key={voice}
              voice={voice}
              index={index}
              selected={index === active}
              previewing={previewingVoice === voice}
              isDownloaded={isDownloaded}
              onPreviewToggle={() => {
                if (previewingVoice === voice) {
                  stopPreview();
                } else {
                  void preview(voice);
                }
              }}
            />
          ))}
        </Carousel.Content>

        <VoiceCarouselDots className="mt-3 self-center" />
      </Carousel>
    </View>
  );
}
