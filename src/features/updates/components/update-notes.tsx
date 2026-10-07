import React from 'react';
import { ScrollView, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { BoxFade } from '@/components/scroll-fades';
import { ThemedText } from '@/components/themed-text';
import { Touchable } from '@/components/ui/touchable';
import { revealIn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

import { notesToShow } from '../utils/release-notes';
import { moreLabel, moreSpoken } from '../utils/update-copy';

/**
 * The box's height if it was somehow opened before it was measured: three
 * rows of tags. Held to nothing, it would swallow the list it was opening.
 */
const UNMEASURED = 120;

type UpdateNotesProps = {
  /** What changed, two or three words each, most important first. */
  notes: string[];
  /** Its place in the dialog's reveal. */
  step?: number;
};

/**
 * What an update brings, as a few square tags read in one look.
 *
 * The first four are drawn, wrapped two to a row, and the rest wait behind a
 * "+ N more". Pressing it opens them where they stand: the box keeps the
 * height it had and scrolls, so the dialog does not grow by a tag however
 * many there are, and the button under it never moves. A row that slides
 * sideways was tried and was shorter still, but it showed two tags at a time
 * and nobody could take the list in without working for it.
 *
 * The tags are read, not pressed, so they sit flat at the size of a line of
 * text with their words in ink. The one that can be pressed is the count,
 * and it alone wears the gold. Nothing here animates per tag: thirty arriving
 * at once would be thirty animated views for something that is only read.
 */
export function UpdateNotes({ notes, step = 2 }: UpdateNotesProps) {
  const tokens = useThemeTokens();
  // The box's height while only the first few are drawn, measured rather
  // than worked out, so it is right at any text size and however they wrap.
  const closedHeight = React.useRef(0);
  const measure = React.useCallback((event: LayoutChangeEvent) => {
    closedHeight.current = event.nativeEvent.layout.height;
  }, []);
  // Set once the rest are asked for: the height the box is then held to.
  // Which notes are on show is this box's own business, and nobody else's.
  const [heldAt, setHeldAt] = React.useState<number | null>(null);
  const showAll = React.useCallback(() => setHeldAt(closedHeight.current || UNMEASURED), []);
  const all = heldAt !== null;
  // Measured only while closed; opened, it is held to that height.
  const onLayout = all ? undefined : measure;
  const box = React.useMemo(() => (heldAt === null ? undefined : { maxHeight: heldAt }), [heldAt]);
  const { shown, more } = notesToShow(notes, all);

  return (
    // A little wider than the words above it, so two tags share a row.
    <Animated.View entering={revealIn(step)} className="-mx-2 gap-3 self-stretch">
      <ThemedText type="labelSm" color={tokens['--color-muted-foreground']} className="text-center">
        {"WHAT'S NEW"}
      </ThemedText>
      <BoxFade surface="popover">
        <ScrollView
          style={box}
          onLayout={onLayout}
          scrollEnabled={all}
          // It sits inside the dialog's own scroll, which Android would
          // otherwise hand every drag to.
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerClassName="flex-row flex-wrap justify-center gap-2"
        >
          {shown.map((note) => (
            <View key={note} className="border border-border bg-muted px-2.5 py-1.5">
              <ThemedText type="bodySm" className="text-center">
                {note}
              </ThemedText>
            </View>
          ))}
          {more > 0 ? (
            <Touchable
              className="border border-border px-2.5 py-1.5"
              haptic="select"
              onPress={showAll}
              accessibilityRole="button"
              accessibilityLabel={moreSpoken(more)}
            >
              <ThemedText type="bodySm" color={tokens['--color-primary']}>
                {moreLabel(more)}
              </ThemedText>
            </Touchable>
          ) : null}
        </ScrollView>
      </BoxFade>
    </Animated.View>
  );
}
