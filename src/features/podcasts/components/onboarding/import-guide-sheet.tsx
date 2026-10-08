import React from 'react';
import { View } from 'react-native';

import { Import, Lock } from '@/components/icons';
import { ThemedText } from '@/components/themed-text';
import { GoldButton } from '@/components/ui/gold-button';
import { Sheet } from '@/components/ui/sheet';
import { fontFamily } from '@/constants/theme';
import { ImportStep } from '@/features/podcasts/components/onboarding/import-step';
import { useThemeTokens } from '@/hooks/use-theme-tokens';

type ImportGuideSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Opens the file picker. */
  onChoose: () => void;
};

/** A menu name inside a step, in the weight that makes it findable on the other app's screen. */
function MenuName({ children }: { children: string }) {
  return <ThemedText style={{ fontFamily: fontFamily.sansSemiBold }}>{children}</ThemedText>;
}

/**
 * How to bring an AntennaPod library across, before the file picker opens:
 * where the export is in AntennaPod, as three steps to follow rather than a
 * sentence to parse, and what happens to the file. Someone who already has
 * it reads nothing and presses the one gold button.
 */
export function ImportGuideSheet({ visible, onClose, onChoose }: ImportGuideSheetProps) {
  const tokens = useThemeTokens();
  const muted = tokens['--color-muted-foreground'];
  return (
    <Sheet visible={visible} onClose={onClose}>
      <View className="gap-8 px-4 pb-2">
        <View className="gap-2">
          <ThemedText type="labelSm" color={muted}>
            IMPORT FROM ANTENNAPOD
          </ThemedText>
          <ThemedText type="headlineMd">Bring your library across</ThemedText>
        </View>
        <View className="gap-4">
          <ImportStep number={1}>
            Open AntennaPod and go to <MenuName>Settings</MenuName>.
          </ImportStep>
          <ImportStep number={2}>
            Choose <MenuName>Import/Export</MenuName>, then <MenuName>Database export</MenuName>.
          </ImportStep>
          <ImportStep number={3}>Save the file, then come back and choose it here.</ImportStep>
        </View>
        <View className="gap-4">
          <View className="flex-row items-center gap-2">
            <Lock size={16} color={muted} />
            <ThemedText type="bodySm" color={muted} className="flex-1">
              The file is read on this phone. Nothing is uploaded.
            </ThemedText>
          </View>
          <GoldButton label="CHOOSE THE FILE" icon={Import} onPress={onChoose} />
          <ThemedText type="bodySm" color={muted} className="text-center">
            An OPML file works too, for your shows only.
          </ThemedText>
        </View>
      </View>
    </Sheet>
  );
}
