import React from 'react';
import { useCSSVariable } from 'uniwind';

import { FabLift } from '@/components/fab-lift';
import { FolderPlus, LibraryBig, Plus, type LucideIcon } from '@/components/icons';
import { ScreenFab } from '@/components/screen-fab';
import { Fab } from '@/components/ui/fab';
import type { AddBooksKey, AddBooksOption } from '@/features/library/utils/add-books-menu';
import { asColor } from '@/utils/colors';

const ICONS: Record<AddBooksKey, LucideIcon> = { files: FolderPlus, free: LibraryBig };

type AddBooksFabProps = {
  options: AddBooksOption[];
  onSelect: (key: AddBooksKey) => void;
};

/**
 * The books side's add button. With more than one way to add books it opens
 * a menu of them out of its corner; with one it is that way, pressed.
 */
export function AddBooksFab({ options, onSelect }: AddBooksFabProps) {
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']);
  const gold = asColor(primary);

  if (options.length === 1) {
    const only = options[0];
    return <ScreenFab icon={Plus} accessibilityLabel={only.label} onPress={() => onSelect(only.key)} />;
  }

  return (
    <FabLift>
      {(position) => (
        <Fab.Group
          layout="menu"
          appearance="wells"
          // Square, like everything else here; the panel's corner is a number, not a theme token.
          menuRadius={0}
          placement="bottom-right"
          haptics
          style={position}
          icon={<Plus size={24} color={asColor(primaryForeground)} strokeWidth={1.8} />}
          accessibilityLabel="Add books"
        >
          {options.map(({ key, label }) => {
            const Icon = ICONS[key];
            return <Fab.Action key={key} icon={<Icon size={18} color={gold} />} label={label} onPress={() => onSelect(key)} />;
          })}
        </Fab.Group>
      )}
    </FabLift>
  );
}
