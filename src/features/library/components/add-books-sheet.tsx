import React from "react";
import { View } from "react-native";

import { PageFade } from "@/components/scroll-fades";
import { ThemedText } from "@/components/themed-text";
import { GoldButton } from "@/components/ui/gold-button";
import { Sheet } from "@/components/ui/sheet";
import { Touchable } from "@/components/ui/touchable";
import { AddBookRow, type PickableBook } from "@/features/library/components/add-book-row";
import { useBookSelection } from "@/features/library/hooks/use-book-selection";
import { useThemeTokens } from "@/hooks/use-theme-tokens";
import { useCSSVariable } from "uniwind";
import { asColor } from "@/utils/colors";
import { countLabel } from "@/utils/format";

type AddBooksSheetProps = {
  visible: boolean;
  allBooks: PickableBook[];
  existingBookIds: string[];
  onConfirm: (selectedBookIds: string[]) => void;
  onClose: () => void;
};

/** Hoisted: a fresh style object per render re-lays the scroll region out. */
const FILL = { flex: 1 } as const;
const keyOf = (item: PickableBook) => item.id;

/** Choosing which books a collection holds: every book, ticked if it is in. */
export function AddBooksSheet({ visible, allBooks, existingBookIds, onConfirm, onClose }: AddBooksSheetProps) {
  const tokens = useThemeTokens();
  const primaryForeground = asColor(useCSSVariable("--color-primary-foreground"));
  const ghost = tokens["--color-surface-tertiary"];
  const muted = tokens["--color-muted-foreground"];
  const { selected, toggle, added } = useBookSelection(visible, existingBookIds);

  const renderItem = React.useCallback(
    ({ item }: { item: PickableBook }) => (
      <AddBookRow
        book={item}
        isSelected={selected.has(item.id)}
        ghostInk={ghost}
        mutedForeground={muted}
        primaryForeground={primaryForeground}
        onToggle={toggle}
      />
    ),
    [selected, ghost, muted, primaryForeground, toggle],
  );
  const confirmLabel = added > 0 ? `ADD ${countLabel(added, "BOOK")}` : "DONE";
  const confirm = () => {
    onConfirm([...selected]);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} fixedHeightRatio={0.65}>
      <View className="flex-1">
        <View className="mb-4 flex-row items-center justify-between px-6">
          <ThemedText type="headlineSm">Add Books</ThemedText>
          <ThemedText type="labelSm" color={muted}>
            {selected.size} selected
          </ThemedText>
        </View>
        <PageFade edges="both" surface="popover">
          <Sheet.FlatList
            style={FILL}
            data={allBooks}
            keyExtractor={keyOf}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </PageFade>
        <View className="px-6 pt-4">
          <GoldButton label={confirmLabel} onPress={confirm} />
          <Touchable onPress={onClose} className="items-center py-3">
            <ThemedText type="labelSm" color={muted}>
              CANCEL
            </ThemedText>
          </Touchable>
        </View>
      </View>
    </Sheet>
  );
}
