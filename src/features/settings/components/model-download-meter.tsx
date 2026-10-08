import React from 'react';

import { DownloadMeter } from '@/components/download-meter';
import { useModelDownload } from '@/features/settings/hooks/use-model-download';

/**
 * A brain's download meter, following its own figure.
 *
 * A container and nothing else: it exists so that the reports of a download
 * redraw this bar and its percentage, and not the card around them.
 */
export function ModelDownloadMeter({ id }: { id: string }) {
  const download = useModelDownload(id);
  return <DownloadMeter {...download} />;
}
