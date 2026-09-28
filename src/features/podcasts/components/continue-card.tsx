import React from 'react';
import { View } from 'react-native';

import { HERO_CARD_MIN_HEIGHT, HeroCard } from '@/components/hero-card';
import { Pause, Play } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Progress } from '@/components/ui/progress';
import { Touchable } from '@/components/ui/touchable';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { episodeArtwork, listenedFraction, playLabel } from '@/features/podcasts/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { EpisodeItem } from '@/services/podcasts/records';
import { useEpisodePlayback } from '@/stores/podcast-player';

/** Fills the card's media box, edge to edge, with no frame of its own. */
const FILL = { width: '100%', height: '100%', borderWidth: 0 } as const;

type ContinueCardProps = {
  episode: EpisodeItem;
  onPress: (episodeId: string) => void;
  onLongPress: (episode: EpisodeItem) => void;
  onPlay: (episodeId: string) => void;
};

/**
 * An episode part-way through, as the hero of the Podcasts page, in the same
 * card as a book in Currently Reading. The gold square plays it: a book is
 * opened, an episode is picked up where it was left.
 */
export function ContinueCard({ episode, onPress, onLongPress, onPlay }: ContinueCardProps) {
  const tokens = useThemeTokens();
  const playing = useEpisodePlayback(episode.id) === 'playing';
  const Icon = playing ? Pause : Play;
  const open = () => onPress(episode.id);
  const menu = () => onLongPress(episode);
  const play = () => onPlay(episode.id);

  const media = (
    <PodcastArtwork
      uri={episodeArtwork(episode)}
      size={HERO_CARD_MIN_HEIGHT}
      placeholderColor={tokens['--color-surface-tertiary']}
      style={FILL}
    />
  );
  const top = (
    <View className="gap-1">
      <ThemedText type="labelSm" color={tokens['--color-primary']} numberOfLines={1}>
        {episode.showTitle}
      </ThemedText>
      <ThemedText type="headlineSm" numberOfLines={2}>
        {episode.title}
      </ThemedText>
    </View>
  );
  const bottom = (
    <View className="gap-2">
      <Progress value={listenedFraction(episode)} minValue={0} maxValue={1} size="sm" />
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText type="labelSm" color={tokens['--color-muted-foreground']} numberOfLines={1} className="flex-1">
          {playing ? 'Playing' : playLabel(episode)}
        </ThemedText>
        <Touchable
          className="h-9 w-9 items-center justify-center bg-primary"
          onPress={play}
          haptic="tap"
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : `Resume ${episode.title}`}
        >
          <Icon size={16} color={tokens['--color-background']} fill={tokens['--color-background']} />
        </Touchable>
      </View>
    </View>
  );

  return <HeroCard mediaAspect={1} media={media} top={top} bottom={bottom} onPress={open} onLongPress={menu} />;
}
