import React from "react";
import { Image, View } from "react-native";

import { Check } from "@/components/icons";
import { ThemedText } from "@/components/themed-text";
import { Touchable } from "@/components/ui/touchable";
import { fontFamily } from "@/constants/theme";
import { cn } from "@/lib/cn";

export type PickableBook = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

const COVER_FILL = { width: "100%" as const, height: "100%" as const };
const INITIAL = { fontSize: 16, fontFamily: fontFamily.serif };

/**
 * One row, memoized: a toggle only re-renders the row whose selection
 * flipped — not every mounted cell — and only the visible window exists
 * at all, so a 400-book library mounts the same dozen rows as a 4-book one.
 */
export const AddBookRow = React.memo(function AddBookRow({
  book,
  isSelected,
  ghostInk,
  mutedForeground,
  primaryForeground,
  onToggle,
}: {
  book: PickableBook;
  isSelected: boolean;
  ghostInk?: string;
  mutedForeground?: string;
  primaryForeground?: string;
  onToggle: (bookId: string) => void;
}) {
  return (
    <Touchable
      className="flex-row items-center gap-4 px-6 py-3"
      onPress={() => onToggle(book.id)}
    >
      <View className="h-[54px] w-9 overflow-hidden bg-muted">
        {book.coverUrl ? (
          <Image
            source={{ uri: book.coverUrl }}
            style={COVER_FILL}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <ThemedText
              type="bodySm"
              color={ghostInk}
              style={INITIAL}
            >
              {book.title.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        )}
      </View>
      <View className="flex-1 gap-1">
        <ThemedText
          type="bodySm"
          numberOfLines={1}
        >
          {book.title}
        </ThemedText>
        <ThemedText
          type="labelSm"
          color={mutedForeground}
          numberOfLines={1}
        >
          {book.author}
        </ThemedText>
      </View>
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full',
          isSelected ? 'bg-primary' : 'bg-muted',
        )}
      >
        {isSelected && (
          <Check size={14} color={primaryForeground} />
        )}
      </View>
    </Touchable>
  );
});
