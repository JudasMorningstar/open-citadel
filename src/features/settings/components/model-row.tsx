import React from 'react';
import type { TextStyle } from 'react-native';
import { View } from 'react-native';

import { Trash2 } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { Swipe } from '@/components/ui/swipe';
import { Touchable } from '@/components/ui/touchable';
import type { LocalModel } from '@/stores/model';
import { formatBytes } from '@/utils/format';

const TABULAR: TextStyle = { fontVariant: ['tabular-nums'] };

function modelDetail(model: LocalModel): string {
  return [
    formatBytes(model.sizeBytes),
    model.isDownloaded ? 'Downloaded' : null,
    model.recommended ? 'Recommended' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

/**
 * One brain in the picker. Only a download can be deleted, so only a
 * downloaded row is a `Swipe`; the brain itself stays listed, ready to
 * download again.
 *
 * The rest are plain rows on purpose. A `Swipe` is a gesture, a dozen shared
 * values and four animated styles, and the picker used to build one for every
 * brain to leave most of them switched off: the sheet rose late and then sat
 * on a placeholder while fifteen of them mounted.
 *
 * Memoized, with stable callbacks from the list, so a scroll or a choice
 * re-renders only the rows whose props changed.
 */
export const ModelRow = React.memo(function ModelRow({
  model,
  active,
  onChoose,
  onDelete,
  mutedForeground,
  primary,
  foreground,
  swipes = true,
}: {
  model: LocalModel;
  active: boolean;
  onChoose: (id: string) => void;
  onDelete: (id: string) => void;
  mutedForeground?: string;
  primary?: string;
  foreground?: string;
  /** False while the sheet is still rising: the row is drawn plain, and takes its swipe once it has landed. */
  swipes?: boolean;
}) {
  const detail = modelDetail(model);

  const row = (
    <Touchable
      className="flex-row items-center gap-3 border-b border-border bg-popover px-6 py-3"
      onPress={() => onChoose(model.id)}
    >
      <View className="flex-1 gap-1">
        <ThemedText type="bodyMd">{model.name}</ThemedText>
        <ThemedText type="labelSm" color={mutedForeground} style={TABULAR}>
          {detail}
        </ThemedText>
      </View>
      {active ? (
        <ThemedText type="bodyMd" color={primary}>
          ✓
        </ThemedText>
      ) : null}
    </Touchable>
  );

  if (!model.isDownloaded || !swipes) return row;

  return (
    <Swipe haptics>
      <Swipe.End>
        <Swipe.Action
          icon={<Trash2 color={foreground} />}
          label="Delete"
          color="destructive"
          labelClassName="text-foreground"
          onPress={() => onDelete(model.id)}
        />
      </Swipe.End>
      {row}
    </Swipe>
  );
});
