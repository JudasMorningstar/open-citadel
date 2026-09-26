import React from 'react';
import { View } from 'react-native';

import { ArrowDownUp, CheckCheck } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { cn } from '@/lib/cn';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { ShowEpisodeFilter } from '@/services/podcasts/episodes';

const FILTERS: { value: ShowEpisodeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unplayed', label: 'Unplayed' },
  { value: 'downloaded', label: 'Downloaded' },
  { value: 'favorites', label: 'Favorites' },
];

type EpisodeListControlsProps = {
  count: number;
  filter: ShowEpisodeFilter;
  sort: 'newest' | 'oldest';
  onFilter: (filter: ShowEpisodeFilter) => void;
  onSort: (sort: 'newest' | 'oldest') => void;
  /** New episodes in this show; offers to clear them from the inbox when there are any. */
  newCount: number;
  onMarkAllSeen: () => void;
};

/** "Episodes", how many, which ones, and in which order: the head of a show's list. */
export function EpisodeListControls({ count, filter, sort, onFilter, onSort, newCount, onMarkAllSeen }: EpisodeListControlsProps) {
  const tokens = useThemeTokens();
  return (
    <View className="gap-3 px-6 pb-2 pt-2">
      <View className="flex-row items-baseline gap-3">
        <ThemedText type="headlineSm" className="flex-1">
          Episodes
        </ThemedText>
        <ThemedText type="labelSm" color={tokens['--color-muted-foreground']}>
          {String(count)}
        </ThemedText>
        {newCount > 0 ? (
          <Touchable
            className="flex-row items-center gap-1.5 border border-border bg-card px-2.5 py-1.5 shadow-sm"
            onPress={onMarkAllSeen}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={`Remove ${newCount} from Just Arrived`}
          >
            <CheckCheck size={12} color={tokens['--color-primary']} />
            <ThemedText type="labelSm" color={tokens['--color-primary']}>
              {`${newCount} NEW`}
            </ThemedText>
          </Touchable>
        ) : null}
        <Touchable
          className="flex-row items-center gap-1.5 border border-border bg-card px-2.5 py-1.5 shadow-sm"
          onPress={() => onSort(sort === 'newest' ? 'oldest' : 'newest')}
          haptic="select"
          accessibilityRole="button"
          accessibilityLabel={sort === 'newest' ? 'Newest first. Show oldest first' : 'Oldest first. Show newest first'}
        >
          <ArrowDownUp size={12} color={tokens['--color-primary']} />
          <ThemedText type="labelSm" color={tokens['--color-primary']}>
            {sort === 'newest' ? 'NEWEST' : 'OLDEST'}
          </ThemedText>
        </Touchable>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {FILTERS.map((f) => {
          const selected = f.value === filter;
          return (
            <Touchable
              key={f.value}
              className={cn('border px-3 py-1.5', selected ? 'border-primary bg-card' : 'border-border bg-muted')}
              onPress={selected ? undefined : () => onFilter(f.value)}
              haptic="select"
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <ThemedText type="labelSm" color={selected ? tokens['--color-primary'] : tokens['--color-foreground']}>
                {f.label}
              </ThemedText>
            </Touchable>
          );
        })}
      </View>
    </View>
  );
}
