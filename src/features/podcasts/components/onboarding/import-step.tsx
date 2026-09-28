import React from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const BOX = 32;

type ImportStepProps = {
  number: number;
  children: React.ReactNode;
};

/**
 * One step of finding the export in AntennaPod: its number in a square, in
 * the serif the app counts in, and what to do.
 */
export function ImportStep({ number, children }: ImportStepProps) {
  return (
    <View className="flex-row items-start gap-4">
      <View className="items-center justify-center border border-border" style={{ width: BOX, height: BOX }}>
        <ThemedText type="headlineSm">{number}</ThemedText>
      </View>
      <ThemedText type="bodyMd" className="flex-1 pt-1">
        {children}
      </ThemedText>
    </View>
  );
}
