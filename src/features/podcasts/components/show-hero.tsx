import React from 'react';
import { View } from 'react-native';

import { ActionButton } from '@/components/action-button';
import { IconButton } from '@/components/icon-button';
import { Check, CircleAlert, Play, SlidersHorizontal } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Touchable } from '@/components/ui/touchable';
import { PodcastArtwork } from '@/features/podcasts/components/podcast-artwork';
import { elevation } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

const ART = 180;

type ShowHeroProps = {
  title: string;
  author: string | null;
  artworkUrl: string | null;
  /** Plain text. */
  description: string | null;
  following: boolean;
  /** The feed is still being fetched (a show opened from Explore). */
  loading: boolean;
  /** False when the show could not be stored, so there is nothing to follow. */
  canFollow: boolean;
  refreshError: string | null;
  canPlayLatest: boolean;
  onFollow: () => void;
  onUnfollow: () => void;
  onPlayLatest: () => void;
  onSettings: () => void;
};

/**
 * The top of a show's page: its artwork large, its name in the library's
 * serif, and the one decision the page exists for. Following is gold until it
 * is made, then steps back to a plain "Following" beside the show's settings.
 */
export function ShowHero({
  title,
  author,
  artworkUrl,
  description,
  following,
  loading,
  canFollow,
  refreshError,
  canPlayLatest,
  onFollow,
  onUnfollow,
  onPlayLatest,
  onSettings,
}: ShowHeroProps) {
  const tokens = useThemeTokens();
  const [expanded, setExpanded] = React.useState(false);
  const muted = tokens['--color-muted-foreground'];

  return (
    <View className="gap-5 px-6 pb-6 pt-2">
      <View className="items-center">
        <View style={elevation.card}>
          {/* No fade: the cover is the one just tapped, decoded again at this
              size in a few frames. Fading it in on top read as a blank cover
              loading in. */}
          <PodcastArtwork uri={artworkUrl} size={ART} placeholderColor={tokens['--color-surface-tertiary']} />
        </View>
      </View>
      <View className="items-center gap-1">
        <ThemedText type="headlineLg" className="text-center" numberOfLines={3}>
          {title}
        </ThemedText>
        {author ? (
          <ThemedText type="bodySm" color={muted} className="text-center" numberOfLines={1}>
            {author}
          </ThemedText>
        ) : null}
      </View>

      {following ? (
        <View className="flex-row gap-3">
          <ActionButton icon={Check} label="FOLLOWING" onPress={onUnfollow} tint={tokens['--color-primary']} centered className="h-11 flex-1" />
          {canPlayLatest ? <ActionButton icon={Play} label="LATEST" onPress={onPlayLatest} tint={tokens['--color-primary']} centered className="h-11 flex-1" /> : null}
          <IconButton label="Show settings" onPress={onSettings} className="h-11 w-11">
            <SlidersHorizontal size={18} color={tokens['--color-primary']} />
          </IconButton>
        </View>
      ) : (
        <GoldButton label="FOLLOW" size="compact" onPress={onFollow} loading={loading} disabled={loading || !canFollow} />
      )}

      {refreshError ? (
        <View className="flex-row items-start gap-2">
          <CircleAlert size={16} color={muted} />
          <ThemedText type="bodySm" color={muted} className="flex-1">
            {refreshError}
          </ThemedText>
        </View>
      ) : null}

      {description ? (
        <Touchable onPress={() => setExpanded((v) => !v)} accessibilityRole="button" accessibilityLabel={expanded ? 'Show less' : 'Show more'}>
          <ThemedText type="bodyMd" numberOfLines={expanded ? undefined : 3}>
            {description}
          </ThemedText>
          <ThemedText type="labelSm" color={tokens['--color-primary']} className="mt-1">
            {expanded ? 'LESS' : 'MORE'}
          </ThemedText>
        </Touchable>
      ) : null}
    </View>
  );
}
