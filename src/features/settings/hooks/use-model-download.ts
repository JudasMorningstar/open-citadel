import React from 'react';

import { useModelStore } from '@/stores/model';

/**
 * Whether a brain is being fetched right now.
 *
 * A boolean, so whoever asks is redrawn when a download starts and when it
 * ends, and not for every report in between. The model card used to read the
 * whole progress table, which redrew the card and all four of its sheets each
 * time a byte count moved.
 */
export function useModelDownloading(id: string | undefined): boolean {
  return useModelStore((s) => id !== undefined && s.downloadProgress[id] !== undefined);
}

/**
 * One brain's download, for the meter that draws it: how far along, and the
 * way to stop it. The only thing that follows the figure itself.
 */
export function useModelDownload(id: string): { progress: number; onCancel: () => void } {
  const progress = useModelStore((s) => s.downloadProgress[id] ?? 0);
  const cancelDownload = useModelStore((s) => s.cancelDownload);
  const onCancel = React.useCallback(() => cancelDownload(id), [cancelDownload, id]);
  return { progress, onCancel };
}
