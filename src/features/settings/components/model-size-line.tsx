import { View, type TextStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/utils/format';

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

/**
 * "1.2 GB · Downloaded", with the size's three states drawn.
 *
 * Known: the figure. Still being measured: a short bar where the figure will
 * be, so the line does not grow a word to its left when it lands. Never
 * measured: the state alone, rather than a dangling " · Downloaded".
 */
export function ModelSizeLine({
  sizeBytes,
  measuring,
  downloaded,
  color,
}: {
  sizeBytes: number | null;
  measuring: boolean;
  downloaded: boolean;
  color?: string;
}) {
  const size = formatBytes(sizeBytes);
  const state = downloaded ? 'Downloaded' : 'Not downloaded';

  if (!size && measuring) {
    return (
      <View className="flex-row items-center gap-1.5">
        <Skeleton className="h-3 w-11" />
        <ThemedText type="labelSm" color={color}>
          · {state}
        </ThemedText>
      </View>
    );
  }

  return (
    <ThemedText type="labelSm" color={color} style={TABULAR}>
      {size ? `${size} · ${state}` : state}
    </ThemedText>
  );
}
