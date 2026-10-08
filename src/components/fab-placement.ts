import { spacing } from '@/constants/theme';

/** The floating button's diameter at the size every screen uses (PanelUI's `md`). */
export const FAB_SIZE = 56;

/**
 * Where a screen's floating button sits: the bottom-right corner, lifted by
 * whatever else floats at the bottom edge (the home indicator, the mini
 * player). PanelUI's `offset` is one number for both edges; this keeps the
 * side margin at the gutter while the bottom moves.
 */
export function fabPosition(bottomOffset = 0) {
  return { bottom: spacing[10] + bottomOffset, right: spacing[6] };
}

/**
 * How much bottom padding a screen's scroll content needs so its last row can
 * be scrolled out from under the button. The button floats over the content by
 * design; this is what stops the final item from being permanently pinned
 * beneath it.
 */
export function fabClearance(insetsBottom: number): number {
  return spacing[10] + FAB_SIZE + insetsBottom;
}
