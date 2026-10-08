import React from 'react';

import { IconSwitch, type IconSwitchItem } from '@/components/icon-switch';
import { Library, MicSignal, Newspaper } from '@/components/icons';
import type { LibraryTab } from '@/stores/podcast-prefs';

const TABS: readonly IconSwitchItem<LibraryTab>[] = [
  { key: 'books', label: 'Library', icon: Library },
  { key: 'podcasts', label: 'Podcasts', icon: MicSignal },
  { key: 'blogs', label: 'Blogs', icon: Newspaper },
];

/** The sides, left to right as the switch draws them, for the view that trades them. */
export const LIBRARY_TAB_ORDER = TABS.map((tab) => tab.key);

/** The Library header's switch between books, podcasts and blogs. */
export function LibraryTabs({ value, onChange }: { value: LibraryTab; onChange: (tab: LibraryTab) => void }) {
  return <IconSwitch items={TABS} value={value} onChange={onChange} />;
}
