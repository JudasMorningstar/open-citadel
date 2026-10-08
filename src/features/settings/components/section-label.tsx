import React from 'react';
import { useCSSVariable } from 'uniwind';

import { ThemedText } from '@/components/themed-text';
import { asColor } from '@/utils/colors';

/** The gold letter-spaced heading over a group of settings. */
export function SectionLabel({ children }: { children: React.ReactNode }) {
  const [primary] = useCSSVariable(['--color-primary']);
  return (
    <ThemedText type="labelMd" color={asColor(primary)} className="tracking-[1.2px]">
      {children}
    </ThemedText>
  );
}
