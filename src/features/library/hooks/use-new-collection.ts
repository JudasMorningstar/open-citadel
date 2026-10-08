import React from 'react';

import { useCollectionsStore } from '@/stores/collections';

/** The "new collection" prompt: whether it is open, and making the collection. */
export function useNewCollection() {
  const [visible, setVisible] = React.useState(false);
  const open = React.useCallback(() => setVisible(true), []);
  const onClose = React.useCallback(() => setVisible(false), []);
  // `createCollection` reloads the list itself.
  const onCreate = React.useCallback(async (name: string) => {
    await useCollectionsStore.getState().createCollection(name);
    setVisible(false);
  }, []);
  return { open, prompt: { visible, onClose, onCreate } };
}

export type NewCollectionState = ReturnType<typeof useNewCollection>;
