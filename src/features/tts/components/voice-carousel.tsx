import React, { useState } from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { CarouselDots } from '@/components/carousel-dots';
import { useOnScreen } from '@/components/kept-alive';
import { ThemedText } from '@/components/themed-text';
import { Carousel, type CarouselHandle } from '@/components/ui/carousel';
import { useVoicePreview } from '@/features/tts/hooks/use-voice-preview';
import { VoiceCarouselSlide } from '@/features/tts/components/voice-carousel-slide';
import type { AiVoice } from '@/services/device-tts/catalogue';
import { asColor } from '@/utils/colors';
import { haptics } from '@/utils/haptics';

const CARD_WIDTH = 240;
const CARD_HEIGHT = 160;
const CARD_GAP = 12;
const ITEM_SIZE = CARD_WIDTH + CARD_GAP;
const CONTENT = { height: CARD_HEIGHT };

export interface VoiceCarouselProps {
  voices: readonly AiVoice[];
  /** The voice in use when it is one of these, or null while another engine reads. */
  selected: AiVoice | null;
  onPick: (voice: AiVoice) => void;
  /**
   * Draw every card. False while whatever the run is in is still arriving (a
   * page sliding in, a sheet rising): then only the card it rests on and the
   * two peeking in beside it are drawn, which is all that can be seen, and
   * the others hold their places empty. A card is the costly part of the run,
   * and ten of them in the frame of a press were most of a second before
   * anything moved on a Galaxy A33.
   */
  full?: boolean;
}

/** How far from the resting card a slide is still in view. */
const IN_VIEW = 1;

/**
 * One engine's voice roster as a snapping carousel: one voice centred at a
 * time, its neighbours peeking in at each edge. See `VoiceCarouselSlide`/
 * `VoiceCarouselCard` for the per-card content and depth, and
 * `CarouselDots` for the page indicator.
 *
 * Only mounted once the voices are downloaded (`AiVoiceSection` shows the
 * download card until then), so every card is playable and selectable.
 */
export function VoiceCarousel({ voices, selected, onPick, full = true }: VoiceCarouselProps) {
  const mutedForeground = useCSSVariable('--color-muted-foreground');
  const { previewingVoice, previewError, previewNotice, preview, stop: stopPreview } = useVoicePreview();
  const run = React.useRef<CarouselHandle>(null);

  const selectedIndex = selected ? voices.indexOf(selected) : -1;
  const [initialIndex] = useState(Math.max(0, selectedIndex));
  const [active, setActive] = useState(initialIndex);

  // The voice this run last knew to be in use: the one it opened on, then
  // whichever it was swiped to.
  const known = React.useRef(selected);
  // Changed somewhere else (the reader's own voice sheet, with this page still
  // open beneath it): the run goes to it.
  React.useEffect(() => {
    if (!selected || selected === known.current) return;
    known.current = selected;
    if (selectedIndex >= 0) run.current?.scrollTo(selectedIndex);
  }, [selected, selectedIndex]);

  // Put away rather than removed (`KeptAlive`): its sample must not play on
  // under whatever took its place.
  const onScreen = useOnScreen();
  React.useEffect(() => {
    if (!onScreen) stopPreview();
  }, [onScreen, stopPreview]);

  const handleIndexChange = (next: number) => {
    setActive(next);
    const voice = voices[next];
    // Arriving on the voice already in use is the run catching up, not a choice.
    if (!voice || voice === known.current) return;
    known.current = voice;
    onPick(voice);
    // A new card arriving mid-preview would keep the old voice's sample
    // playing under the new one's now-selected controls.
    stopPreview();
    haptics.select();
  };

  return (
    <View className="gap-4">
      <Carousel
        ref={run}
        variant="default"
        align="center"
        itemSize={ITEM_SIZE}
        defaultIndex={initialIndex}
        onIndexChange={handleIndexChange}
      >
        <Carousel.Content style={CONTENT}>
          {voices.map((voice, index) => (
            <VoiceCarouselSlide
              key={voice}
              voice={voice}
              index={index}
              selected={index === active}
              bare={!full && Math.abs(index - initialIndex) > IN_VIEW}
              previewing={previewingVoice === voice}
              onPreview={preview}
              onStopPreview={stopPreview}
            />
          ))}
        </Carousel.Content>

        <CarouselDots className="mt-3 self-center" label="Voice" />
      </Carousel>
      {(previewError || previewNotice) && (
        <ThemedText type="bodySm" color={asColor(mutedForeground)}>
          {previewError || previewNotice}
        </ThemedText>
      )}
    </View>
  );
}
