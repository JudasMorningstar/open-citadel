import React from 'react';
import { View } from 'react-native';

/** The hairline between two rows of a list (episodes, posts), inset to the gutter. */
export function RowSeparator() {
  return <View className="mx-6 h-px bg-border" />;
}
