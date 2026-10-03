import React from 'react';

import { useHubStore } from '@/stores/hub';

/**
 * A side of the Library says when it has drawn its content (or its welcome)
 * instead of its skeleton. The first to say so is what lets the hub mount its
 * other pages; see `libraryFilled` on the hub store.
 */
export function useLibraryFilled(filled: boolean): void {
  React.useEffect(() => {
    if (filled) useHubStore.getState().libraryHasFilled();
  }, [filled]);
}
