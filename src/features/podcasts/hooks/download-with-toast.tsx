import React from 'react';

import { dismissToast, showToast } from '@/components/toast/toast-provider';
import { DownloadToastStop } from '@/features/podcasts/components/download-toast-stop';
import * as actions from '@/services/podcasts/actions';
import { isPending, onDownloadSettled } from '@/services/podcasts/download-queue';
import type { EpisodeItem } from '@/services/podcasts/records';

/**
 * Starts a download and follows it in a toast: "Downloading" with the
 * progress square to stop it from, then "Downloaded" once it is on the
 * device. Each download has its own toast, keyed by episode, so several at
 * once stack rather than writing over each other.
 *
 * For a download started from a menu, which otherwise closes and leaves no
 * sign anything happened. A row's own button already shows its progress.
 */
export function downloadWithToast(episode: Pick<EpisodeItem, 'id' | 'title'>): void {
  const { id, title } = episode;
  const key = `download:${id}`;
  const failed = () => showToast({ key, message: `Couldn't download ${title}` });

  showToast({
    key,
    message: `Downloading ${title}`,
    accessory: <DownloadToastStop episodeId={id} title={title} onStop={() => void actions.removeDownload([id])} />,
  });

  // Listening before the download is queued, so a quick end is never missed.
  const stopListening = onDownloadSettled((settledId, outcome) => {
    if (settledId !== id) return;
    stopListening();
    if (outcome === 'downloaded') showToast({ key, message: `Downloaded ${title}`, tone: 'success' });
    else if (outcome === 'failed') failed();
    else dismissToast(key);
  });

  actions.download([id]).then(
    (queued) => {
      // Already on its way (a second press, or the row's own button): the
      // download running is the one this toast follows, and its end arrives
      // as any other would.
      if (queued.includes(id) || isPending(id)) return;
      // Already on the device: there is nothing to follow.
      stopListening();
      dismissToast(key);
    },
    () => {
      stopListening();
      failed();
    },
  );
}
