import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ActionButton } from '@/components/action-button';
import { CircleCheckBig, Import } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Progress } from '@/components/ui/progress';
import { motion, popIn, revealIn } from '@/constants/theme';
import type { ImportResult, ImportState } from '@/features/podcasts/hooks/use-antennapod-import';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ImportViewProps = {
  state: Exclude<ImportState, { phase: 'idle' }>;
  onDone: () => void;
  onRetry: () => void;
};

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** What came across, as short plain lines. Nothing that did not happen is listed. */
function summaryLines(result: ImportResult): string[] {
  if (result.kind === 'opml') {
    return [
      plural(result.added, 'show followed', 'shows followed'),
      ...(result.failed > 0 ? [`${plural(result.failed, 'feed', 'feeds')} could not be reached`] : []),
    ];
  }
  const s = result.summary;
  return [
    plural(s.shows, 'show', 'shows'),
    plural(s.episodes, 'episode', 'episodes'),
    ...(s.inProgress > 0 ? [`${s.inProgress} part-way through`] : []),
    ...(s.played > 0 ? [`${s.played} played`] : []),
    ...(s.favorites > 0 ? [plural(s.favorites, 'favorite', 'favorites')] : []),
    ...(s.queued > 0 ? [`${s.queued} in Up Next`] : []),
  ];
}

/**
 * An import running, finished, or stopped: in place of the welcome, so the
 * listener never leaves the page they started it from.
 */
export function ImportView({ state, onDone, onRetry }: ImportViewProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];

  if (state.phase === 'running') {
    const { done, total, current } = state.progress;
    return (
      <View className="flex-1 justify-center gap-5 px-10">
        <ThemedText type="headlineMd">Bringing your library across</ThemedText>
        <Progress value={total > 0 ? done / total : 0} minValue={0} maxValue={1} size="sm" />
        <ThemedText type="bodySm" color={muted} numberOfLines={1}>
          {total > 0 ? `${done} of ${total}${current ? `: ${current}` : ''}` : 'Reading the file'}
        </ThemedText>
      </View>
    );
  }

  if (state.phase === 'failed') {
    return (
      <View className="flex-1 justify-center gap-5 px-10">
        <ThemedText type="headlineMd">That did not work</ThemedText>
        <ThemedText type="bodyMd" color={muted}>
          {state.message}
        </ThemedText>
        <ActionButton icon={Import} label="CHOOSE ANOTHER FILE" onPress={onRetry} tint={tokens['--color-primary']} centered className="h-12" />
      </View>
    );
  }

  const lines = summaryLines(state.result);
  return (
    <View className="flex-1 justify-center gap-5 px-10">
      <Animated.View entering={popIn(motion.base)}>
        <CircleCheckBig size={40} color={tokens['--color-primary']} />
      </Animated.View>
      <ThemedText type="headlineLg">Welcome back</ThemedText>
      <View className="gap-1">
        {lines.map((line, i) => (
          <Animated.View key={line} entering={revealIn(i)}>
            <ThemedText type="bodyMd">{line}</ThemedText>
          </Animated.View>
        ))}
      </View>
      <ThemedText type="bodySm" color={muted}>
        {state.result.kind === 'database'
          ? 'Downloads stay in AntennaPod. Download again anything you want offline here. New episodes are being fetched now.'
          : 'Your listening history lives in the database export, if you want it too.'}
      </ThemedText>
      <GoldButton label="OPEN MY PODCASTS" onPress={onDone} />
    </View>
  );
}
