import React from 'react';
import Animated, { type AnimatedProps } from 'react-native-reanimated';
import type { ViewProps } from 'react-native';

import { SectionHeader } from '@/components/ui/section-header';
import { contentColumn } from '@/constants/theme';

type ShelfSectionProps = {
  title: string;
  /** Beside the title, `12`. */
  count?: string;
  onViewAll: () => void;
  /** The reveal it arrives with, when the page staggers its sections in. */
  entering?: AnimatedProps<ViewProps>['entering'];
  /**
   * Capped to the content column (the default). A full-width pager opts out:
   * its pages own the window width and cap their own cards.
   */
  capped?: boolean;
  children: React.ReactNode;
};

/**
 * One shelf of a Library page: its title, its VIEW ALL, and what is on it.
 * Both sides of the Library are laid out from these, so they read as one
 * place with two collections in it.
 */
export function ShelfSection({ title, count, onViewAll, entering, capped = true, children }: ShelfSectionProps) {
  const viewAll = { text: 'VIEW ALL', onPress: onViewAll };
  return (
    <Animated.View entering={entering} className="mb-8 gap-4" style={capped ? contentColumn : undefined}>
      <SectionHeader title={title} count={count} rightAction={viewAll} />
      {children}
    </Animated.View>
  );
}
