import React from 'react';
import { View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { Pause, Play } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { elevation } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Touchable } from '@/components/ui/touchable';
import { voiceDescriptor, voiceLabel, type AiVoice } from '@/services/device-tts/catalogue';
import { asColor } from '@/utils/colors';
import { cn } from '@/lib/cn';

export interface VoiceCarouselCardProps {
  voice: AiVoice;
  index: number;
  selected: boolean;
  previewing: boolean;
  /** Bring this card to the middle. Stable, so a settle redraws two cards, not all. */
  onSelect: (index: number) => void;
  onPreview: (voice: AiVoice) => void;
  onStopPreview: () => void;
}

/**
 * One voice, as a card's content — index, name, descriptor and a sample
 * button. Depth (the scale and opacity that follow the finger as the run
 * moves) lives one level up in `VoiceCarouselSlide`, the same split
 * `PlanSlide`/`PlanCard` use for the plan run.
 *
 * The select touchable and the sample button are siblings, not one nested in
 * the other — see `toc-bookmark-row.tsx` for the same call elsewhere in this
 * app. A `Touchable` inside another accessible `Touchable` reads fine to a
 * finger (RN's responder system hands the gesture to whichever one is
 * innermost) but not to VoiceOver/TalkBack, which can swallow or
 * double-announce the inner one; nothing in this codebase ships that nesting
 * unmitigated, so this doesn't either.
 */
export const VoiceCarouselCard = React.memo(function VoiceCarouselCard({
  voice,
  index,
  selected,
  previewing,
  onSelect,
  onPreview,
  onStopPreview,
}: VoiceCarouselCardProps) {
  const [mutedForeground, primary] = useCSSVariable(['--color-muted-foreground', '--color-primary']);

  const name = voiceLabel(voice);
  const descriptor = voiceDescriptor(voice);
  const playing = selected && previewing;
  const sampleLabel = playing ? 'STOP' : 'SAMPLE';
  const select = () => onSelect(index);
  const toggleSample = () => (playing ? onStopPreview() : onPreview(voice));

  return (
    <Card
      className={cn(
        'h-full w-full justify-between rounded-none p-4',
        selected ? 'border-primary' : 'border-border',
      )}
      style={selected ? elevation.card : undefined}
    >
      <Touchable
        onPress={select}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${name}, ${descriptor}${selected ? ', selected' : ''}`}
      >
        <View className="flex-row items-start justify-between">
          <ThemedText type="mono" color={asColor(mutedForeground)}>
            {String(index + 1).padStart(2, '0')}
          </ThemedText>
          {selected ? (
            <ThemedText type="labelSm" color={asColor(primary)}>
              SELECTED
            </ThemedText>
          ) : null}
        </View>

        <View className="mt-2 gap-1">
          <ThemedText type="displayMd">{name}</ThemedText>
          <ThemedText type="mono" color={asColor(mutedForeground)}>
            {descriptor}
          </ThemedText>
        </View>
      </Touchable>

      <Touchable
        className={cn(
          'h-8 flex-row items-center gap-1.5 self-start rounded-none border px-3',
          selected ? 'border-primary' : 'border-border',
        )}
        hitSlop={6}
        onPress={selected ? toggleSample : select}
        accessibilityRole="button"
        accessibilityLabel={playing ? `Stop ${name} preview` : `Play ${name} preview`}
      >
        {playing ? (
          <Pause size={12} color={asColor(primary)} />
        ) : (
          <Play size={12} color={selected ? asColor(primary) : asColor(mutedForeground)} />
        )}
        <ThemedText type="labelSm" color={selected ? asColor(primary) : asColor(mutedForeground)}>
          {sampleLabel}
        </ThemedText>
      </Touchable>
    </Card>
  );
});
