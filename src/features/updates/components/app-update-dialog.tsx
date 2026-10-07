import React from 'react';
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { CircleAlert, RotateCw, Sparkles } from '@/components/icons';
import { BoxFade } from '@/components/scroll-fades';
import { StageGlyph } from '@/components/stage/stage-glyph';
import { StageHeading } from '@/components/stage/stage-heading';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Touchable } from '@/components/ui/touchable';
import { easing, motion, popIn, revealIn } from '@/constants/theme';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

import { updateCopy, type UpdatePhase } from '../utils/update-copy';
import { UpdateNotes } from './update-notes';

type AppUpdateDialogProps = {
  visible: boolean;
  phase: UpdatePhase;
  /** What the update brings, a few words each. None is fine. */
  notes: string[];
  onUpdate: () => void;
  /** Leaving without the update, offered only after a restart has failed. */
  onLeave: () => void;
};

/**
 * How much of the screen's height the stage may take before it scrolls. It
 * never does at ordinary sizes, and the notes keep to a box of their own. On
 * a small phone with very large text the stage would otherwise push the one
 * button off the screen, and a dialog that cannot be left must never lose its
 * button.
 */
const STAGE_SHARE = 0.6;

function stay() {}

/**
 * An update is on the phone and waiting for a restart.
 *
 * A stage in a dialog, kept close to the height of an alert: the mark, a title
 * and one line, the few changes that matter most, and the one gold action at
 * the foot, where the thumb is. It is an RN `Modal`, a window of its
 * own, so it sits over every sheet and toast.
 *
 * There is no cancel, no tap outside and no Back, because the update is not a
 * question. The exception is a restart that fails: the dialog then says so,
 * offers the retry, and lets them carry on (see `updateCopy`).
 *
 * Memoized: its container hears every step of a check and a download, and
 * none of those change anything drawn here.
 */
export const AppUpdateDialog = React.memo(function AppUpdateDialog({
  visible,
  phase,
  notes,
  onUpdate,
  onLeave,
}: AppUpdateDialogProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  const copy = updateCopy(phase);
  const failed = phase === 'failed';
  const onBack = failed ? onLeave : stay;
  const glyph = failed ? CircleAlert : Sparkles;
  const glyphColor = failed ? muted : tokens['--color-primary'];
  const restarting = phase === 'restarting';
  const showNotes = notes.length > 0 && !failed;
  const { height } = useWindowDimensions();
  const stage = React.useMemo(() => ({ maxHeight: height * STAGE_SHARE }), [height]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onBack}
    >
      <Animated.View
        entering={FadeIn.duration(motion.fast).easing(easing)}
        className="items-center justify-center bg-scrim p-6"
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          entering={popIn(motion.base)}
          accessibilityViewIsModal
          className="w-full max-w-[380px] border border-border bg-popover"
        >
          <BoxFade surface="popover">
            <ScrollView style={stage} showsVerticalScrollIndicator={false} bounces={false}>
              {/* Keyed by outcome, so a failed restart composes itself in as
                  a new stage instead of swapping words under a still picture. */}
              <View key={failed ? 'failed' : 'ready'} className="items-center gap-6 px-6 pb-6 pt-8">
                <StageGlyph icon={glyph} color={glyphColor} />
                <StageHeading title={copy.title} subtitle={copy.line} />
                {showNotes ? <UpdateNotes notes={notes} /> : null}
              </View>
            </ScrollView>
          </BoxFade>
          <Animated.View entering={revealIn(3)} className="gap-2 px-4 pb-4">
            <GoldButton label={copy.action} icon={RotateCw} loading={restarting} onPress={onUpdate} />
            {copy.wayOut ? (
              <Touchable className="items-center py-3" onPress={onLeave} accessibilityRole="button">
                <ThemedText type="labelMd" color={muted}>
                  {copy.wayOut}
                </ThemedText>
              </Touchable>
            ) : null}
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});
