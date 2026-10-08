import React from "react";
import { View } from "react-native";
import { useCSSVariable } from "uniwind";

import { Info, Lock, type LucideIcon } from "@/components/icons";
import { SamwellText } from "@/components/samwell-text";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { PrefixIcon } from "@/components/ui/prefix-icon";
import { Touchable } from "@/components/ui/touchable";
import { cn } from "@/lib/cn";
import { asColor } from "@/utils/colors";

export interface ModeCardProps {
  active: boolean;
  icon: LucideIcon;
  label: string;
  description: string;
  /** A short status line under the description, e.g. "READY". */
  status?: string;
  onSelect: () => void;
  /** Shows an info button in the corner. Omitted when the card has nothing to explain. */
  onInfo?: () => void;
  disabled?: boolean;
  /**
   * Not open yet: the card takes no press and wears a lock in its corner, so
   * it reads as "not yet" and not as "broken". Say when in `status`.
   */
  locked?: boolean;
  /** A smaller icon and tighter padding, for a card that shares a drawer with other controls. */
  compact?: boolean;
}

/**
 * One of two side-by-side choices (Samwell on-device or cloud, a reading voice
 * on-device or cloud): the selected one is outlined in the primary colour.
 */
export function ModeCard({
  active,
  icon,
  label,
  description,
  status,
  onSelect,
  onInfo,
  disabled,
  locked,
  compact,
}: ModeCardProps) {
  const off = disabled || locked;
  const [primary, mutedForeground] = useCSSVariable([
    "--color-primary",
    "--color-muted-foreground",
  ]);
  return (
    <Touchable
      className="flex-1"
      onPress={onSelect}
      disabled={off}
      accessibilityRole="radio"
      accessibilityState={{ selected: active, disabled: off }}
    >
      {/* `flex-1` on the card, not just on the Touchable around it. The row
          stretches both Touchables to the taller of the two, but the card
          inside still sized to its own text, so the one-line description left
          a card visibly shorter than the two-line one beside it. */}
      {/* Dimmed here rather than on the Touchable around it, whose pressed
          opacity takes over the class. */}
      <Card
        className={cn(
          "flex-1 justify-between",
          compact ? "gap-2 p-3" : "gap-3 p-4",
          active && "border-primary",
          off && "opacity-50",
        )}
      >
        <View className={compact ? "gap-1.5" : "gap-2"}>
          <View className={cn("flex-row items-center", compact ? "gap-2" : "gap-3")}>
            <PrefixIcon
              icon={icon}
              size={compact ? 28 : 36}
              color={active ? asColor(primary) : undefined}
            />
            <ThemedText
              type="bodyMd"
              color={active ? asColor(primary) : undefined}
            >
              {label}
            </ThemedText>
          </View>
          {/* His name in gold here as everywhere else. These two lines were
              missed by the first sweep because they arrive as a prop rather
              than as literal text in the JSX. */}
          <SamwellText type="bodySm" color={asColor(mutedForeground)}>
            {description}
          </SamwellText>
        </View>
        {/* Pinned to the foot of the card, so the two status lines line up
            however long each description runs. */}
        {status ? (
          <ThemedText
            type="labelSm"
            color={active ? asColor(primary) : asColor(mutedForeground)}
          >
            {status}
          </ThemedText>
        ) : null}
        {locked ? (
          <View className="absolute right-2 top-2">
            <Lock size={15} color={asColor(mutedForeground)} />
          </View>
        ) : null}
        {onInfo ? (
          <Touchable
            className="absolute right-2 top-2"
            onPress={onInfo}
            hitSlop={10}
          >
            <Info size={15} color={asColor(mutedForeground)} />
          </Touchable>
        ) : null}
      </Card>
    </Touchable>
  );
}
