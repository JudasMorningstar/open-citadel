import React, { useState } from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { Carousel } from '@/components/ui/carousel';
import { useVoicePreview } from '@/features/tts/hooks/use-voice-preview';
import { VoiceCarouselDots } from '@/features/tts/components/voice-carousel-dots';
import { VoiceCarouselSlide } from '@/features/tts/components/voice-carousel-slide';
import { KOKORO_VOICES, resolveVoice } from '@/services/device-tts/catalogue';
import { useSettingsStore } from '@/stores/settings';
import { asColor } from '@/utils/colors';
import { haptics } from '@/utils/haptics';

const CARD_WIDTH = 240;
const CARD_HEIGHT = 160;
const CARD_GAP = 12;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;

/**
 * The Kokoro voice roster as a snapping carousel: one voice centred at a
 * time, its neighbours peeking in at each edge. See `VoiceCarouselSlide`/
 * `VoiceCarouselCard` for the per-card content and depth, and
 * `VoiceCarouselDots` for the page indicator.
 *
 * Only mounted once the voices are downloaded (`TtsSettingsPanel` shows the
 * download card until then), so every card is playable and selectable.
 * Otherwise self-contained, like the panel that hosts it — reads and writes
 * `useSettingsStore` directly.
 */
export function VoiceCarousel() {
  const mutedForeground = useCSSVariable('--color-muted-foreground');

  const ttsVoice = useSettingsStore((s) => s.ttsVoice);
  const setTtsVoice = useSettingsStore((s) => s.setTtsVoice);
  const { previewingVoice, previewError, previewNotice, preview, stop: stopPreview } = useVoicePreview();

  const initialIndex = KOKORO_VOICES.indexOf(resolveVoice(ttsVoice));
  const [active, setActive] = useState(initialIndex);

  const handleIndexChange = (next: number) => {
    setActive(next);
    setTtsVoice(KOKORO_VOICES[next]);
    // A new card arriving mid-preview would keep the old voice's sample
    // playing under the new one's now-selected controls.
    stopPreview();
    haptics.select();
  };

  return (
    <View className="gap-4">
      <Carousel
        variant="default"
        align="center"
        itemSize={ITEM_SIZE}
        defaultIndex={initialIndex}
        onIndexChange={handleIndexChange}
      >
        <Carousel.Content style={{ height: CARD_HEIGHT }}>
          {KOKORO_VOICES.map((voice, index) => (
            <VoiceCarouselSlide
              key={voice}
              voice={voice}
              index={index}
              selected={index === active}
              previewing={previewingVoice === voice}
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
      {(previewError || previewNotice) && (
        <ThemedText type="bodySm" color={asColor(mutedForeground)}>
          {previewError || previewNotice}
        </ThemedText>
      )}
    </View>
  );
}
