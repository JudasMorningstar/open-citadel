import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useCSSVariable } from 'uniwind';

import { CircleCheck, X } from '@/components/icons';
import type { ToastEntry } from '@/components/toast/types';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { fontFamily } from '@/constants/theme';
import { asColor } from '@/utils/colors';

/** The action icon's box, which the pending spinner takes over. */
const ACTION_BOX = { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' } as const;

type ToastRowProps = {
  toast: ToastEntry;
  /** Held on screen until settled, which is what earns it a close beside its action. */
  persistent: boolean;
  onAction: () => void;
  onClose: () => void;
};

/** What a toast says, and its one control. How it moves is `ToastItem`'s. */
export function ToastRow({ toast, persistent, onAction, onClose }: ToastRowProps) {
  const [foreground, mutedForeground, success] = useCSSVariable([
    '--color-foreground',
    '--color-muted-foreground',
    '--color-success-foreground',
  ]);
  // A busy toast's spinner stands in for every control: there is nothing to
  // press while the work it reports runs. So does an accessory: it is the
  // toast's one control.
  const hasAccessory = toast.accessory != null;
  const hasAction = !toast.busy && !hasAccessory && toast.actionIcon != null && toast.actionLabel != null;
  const showPendingAction = hasAction && toast.actionPending === true;
  const showAction = hasAction && !toast.actionPending;
  const showClose = !toast.busy && !hasAccessory && (!hasAction || persistent);
  const ActionIcon = toast.actionIcon;

  return (
    <Card.Content className="flex-row items-center gap-3 p-3">
      {toast.tone === 'success' && (
        <CircleCheck size={18} color={asColor(success)} strokeWidth={2} />
      )}
      <Text
        numberOfLines={2}
        className="flex-1"
        style={{ fontFamily: fontFamily.sans, fontSize: 14, color: asColor(foreground) }}
      >
        {toast.message}
      </Text>
      {/* The action replaces the close rather than joining it: two icons
          on one line is the busy, uneven row this layout exists to
          avoid, and a swipe or the timer still dismisses either way. */}
      {hasAccessory && toast.accessory}
      {toast.busy && (
        <View style={ACTION_BOX}>
          <Spinner size="sm" label={toast.message} />
        </View>
      )}
      {showPendingAction && (
        // Same footprint as the icon, so the row does not shift when the
        // press turns into work.
        <View style={ACTION_BOX}>
          <Spinner size="sm" label={toast.actionLabel} />
        </View>
      )}
      {ActionIcon && showAction && (
        <Pressable hitSlop={8} accessibilityRole="button" accessibilityLabel={toast.actionLabel} onPress={onAction}>
          <ActionIcon size={18} color={asColor(foreground)} />
        </Pressable>
      )}
      {/* The close normally steps aside for an action, because a swipe
          and the timer both still dismiss. A persistent toast has
          neither, so declining needs its own control. */}
      {showClose && (
        <Pressable
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={toast.dismissLabel ?? 'Dismiss'}
          onPress={onClose}
        >
          <X size={18} color={asColor(mutedForeground)} />
        </Pressable>
      )}
    </Card.Content>
  );
}
