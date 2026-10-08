import { View } from "react-native";
import { useCSSVariable } from "uniwind";

import { ActionButton } from "@/components/action-button";
import { MemoryStick, RotateCcw } from "@/components/icons";
import { ThemedText } from "@/components/themed-text";
import { Sheet } from "@/components/ui/sheet";
import { asColor } from "@/utils/colors";

type MemoryEstimate = {
  status: string;
  /** The model's own size on disk, which the verdict is derived from. */
  modelBytes?: number | null;
  totalGb?: number;
};

const TIGHT = "#f97316";

/**
 * What "TIGHT"/"TOO LARGE" actually means, with the numbers behind it. A brain
 * the phone has already closed the app over says that instead, since it is
 * what happened rather than an estimate, and offers the way to try it again.
 */
export function MemoryInfoSheet({
  visible,
  onClose,
  status,
  estimate,
  closedMessage,
  onTryAgain,
}: {
  visible: boolean;
  onClose: () => void;
  status: string;
  estimate: MemoryEstimate | null;
  /** What happened, when the phone has ended the app over this brain. */
  closedMessage?: string | null;
  onTryAgain?: () => void;
}) {
  const [mutedForeground, destructive, primary] = useCSSVariable([
    "--color-muted-foreground",
    "--color-destructive",
    "--color-primary",
  ]);
  const wontFit = status === "wontRun" || !!closedMessage;
  const heading = closedMessage ? "Closed by your phone" : wontFit ? "Too Large" : "Memory Tight";
  const body =
    closedMessage ??
    (wontFit
      ? "This brain needs more RAM than your device has. Loading it will likely crash the app. Try a smaller or more quantized brain."
      : "This brain may run slowly or fail to wake up. Free up RAM by closing other apps, or try a smaller brain.");

  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-6 px-6">
        <View className="flex-row items-center gap-2">
          <MemoryStick
            size={18}
            color={wontFit ? asColor(destructive) : TIGHT}
          />
          <ThemedText type="headlineSm">{heading}</ThemedText>
        </View>
        <ThemedText type="bodySm" color={asColor(mutedForeground)}>
          {body}
        </ThemedText>
        {estimate && (
          <View className="gap-1">
            {estimate.modelBytes != null && (
              <ThemedText
                type="labelSm"
                color={asColor(mutedForeground)}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                Brain size: {(estimate.modelBytes / 1024 ** 3).toFixed(1)} GB
              </ThemedText>
            )}
            {estimate.totalGb != null && (
              <ThemedText
                type="labelSm"
                color={asColor(mutedForeground)}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                Device RAM: {estimate.totalGb.toFixed(1)} GB
              </ThemedText>
            )}
          </View>
        )}
        {closedMessage && onTryAgain && (
          <View className="gap-2">
            <ThemedText type="bodySm" color={asColor(mutedForeground)}>
              Closing other apps first gives him more room.
            </ThemedText>
            <ActionButton
              className="self-start"
              icon={RotateCcw}
              label="TRY AGAIN"
              tint={asColor(primary)}
              onPress={onTryAgain}
            />
          </View>
        )}
      </View>
    </Sheet>
  );
}
