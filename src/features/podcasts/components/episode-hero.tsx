import React from 'react';
import { View } from 'react-native';

import { CircleCheckBig, Download, ListEnd, ListX, RotateCcw, Square, Star, Trash2, type LucideIcon } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Progress } from '@/components/ui/progress';
import { Touchable } from '@/components/ui/touchable';
import { elevation } from '@/constants/theme';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { formatPubDate, formatDuration, listenedFraction, playLabel } from '@/features/podcasts/utils/format';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { Episode } from '@/services/podcasts/records';
import { formatBytes } from '@/utils/format';

const ART = 200;

type EpisodeHeroProps = {
  episode: Episode;
  showTitle: string;
  artworkUrl: string | null;
  playback: 'playing' | 'paused' | 'idle';
  onPlay: () => void;
  onOpenShow: () => void;
  onToggleQueue: () => void;
  onDownload: () => void;
  onRemoveDownload: () => void;
  onToggleFavorite: () => void;
  onTogglePlayed: () => void;
};

type Tile = { key: string; icon: LucideIcon; label: string; onPress: () => void; active?: boolean };

/** One of the things done to an episode besides playing it. */
function ActionTile({ tile, gold, ink }: { tile: Tile; gold: string | undefined; ink: string | undefined }) {
  const color = tile.active ? gold : ink;
  return (
    <Touchable
      className="flex-1 items-center gap-2 border border-border bg-card py-3 shadow-sm"
      onPress={tile.onPress}
      haptic="select"
      accessibilityRole="button"
      accessibilityLabel={tile.label}
    >
      <tile.icon size={20} color={color} />
      <ThemedText type="labelSm" color={color} numberOfLines={1}>
        {tile.label}
      </ThemedText>
    </Touchable>
  );
}

/**
 * The top of an episode's page: what it is, how far in the listener is, and
 * one gold button that plays it, with the other things done to an episode as
 * equal tiles beneath. The show's name above the title goes to the
 * show.
 */
export function EpisodeHero({
  episode,
  showTitle,
  artworkUrl,
  playback,
  onPlay,
  onOpenShow,
  onToggleQueue,
  onDownload,
  onRemoveDownload,
  onToggleFavorite,
  onTogglePlayed,
}: EpisodeHeroProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const fraction = listenedFraction(episode);
  const started = fraction > 0 && episode.playState !== 'played';
  const meta = [formatPubDate(episode.pubDate), formatDuration(episode.durationSec), formatBytes(episode.fileSize)]
    .filter(Boolean)
    .join(' · ');
  const downloaded = episode.downloadStatus === 'downloaded';
  const downloading = episode.downloadStatus === 'queued' || episode.downloadStatus === 'downloading';
  const playText =
    playback === 'playing'
      ? 'PAUSE'
      : playback === 'paused' || started
        ? 'RESUME'
        : episode.playState === 'played'
          ? 'PLAY AGAIN'
          : 'PLAY';

  // The episode in the player is already what plays now; Up Next is for what comes after it.
  const queueTile: Tile[] =
    playback !== 'idle'
      ? []
      : episode.queuePosition == null
        ? [{ key: 'queue', icon: ListEnd, label: 'Up Next', onPress: onToggleQueue }]
        : [{ key: 'queue', icon: ListX, label: 'Queued', onPress: onToggleQueue, active: true }];
  const tiles: Tile[] = [
    ...queueTile,
    downloaded
      ? { key: 'download', icon: Trash2, label: 'Delete', onPress: onRemoveDownload }
      : downloading
        ? { key: 'download', icon: Square, label: 'Cancel', onPress: onRemoveDownload, active: true }
        : { key: 'download', icon: Download, label: 'Download', onPress: onDownload },
    { key: 'favorite', icon: Star, label: 'Favorite', onPress: onToggleFavorite, active: episode.isFavorite === 1 },
    episode.playState === 'played'
      ? { key: 'played', icon: RotateCcw, label: 'Played', onPress: onTogglePlayed, active: true }
      : { key: 'played', icon: CircleCheckBig, label: 'Played', onPress: onTogglePlayed },
  ];

  return (
    <View className="gap-5">
      <View className="items-center">
        <View style={elevation.card}>
          <PodcastArtwork uri={artworkUrl} size={ART} placeholderColor={tokens['--color-surface-tertiary']} />
        </View>
      </View>
      <View className="items-center gap-2">
        <Touchable onPress={onOpenShow} hitSlop={6} accessibilityRole="link" accessibilityLabel={`Go to ${showTitle}`}>
          <ThemedText type="labelSm" color={tokens['--color-primary']} className="text-center" numberOfLines={1}>
            {showTitle}
          </ThemedText>
        </Touchable>
        <ThemedText type="headlineLg" className="text-center">
          {episode.title}
        </ThemedText>
        <ThemedText type="labelSm" color={muted} className="text-center">
          {meta}
        </ThemedText>
      </View>
      {started ? (
        <View className="gap-2">
          <Progress value={fraction} minValue={0} maxValue={1} size="sm" />
          <ThemedText type="labelSm" color={muted}>
            {playLabel(episode)}
          </ThemedText>
        </View>
      ) : null}
      <GoldButton label={playText} onPress={onPlay} />
      <View className="flex-row gap-2">
        {tiles.map((tile) => (
          <ActionTile key={tile.key} tile={tile} gold={tokens['--color-primary']} ink={tokens['--color-foreground']} />
        ))}
      </View>
    </View>
  );
}
