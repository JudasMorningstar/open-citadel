import React from 'react';

import { CircleAlert, Download, Trash2 } from '@/components/icons';
import { Touchable } from '@/components/ui/touchable';
import { DownloadRing } from '@/features/podcasts/components/download-ring';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { EpisodeItem } from '@/services/podcasts/records';

const BOX = 32;

type DownloadButtonProps = {
  episode: Pick<EpisodeItem, 'id' | 'downloadStatus'>;
  onDownload: (episodeId: string) => void;
  /** Cancel a running download, or remove a finished one. */
  onRemove: (episodeId: string) => void;
};

/**
 * An episode's download, in four states: not downloaded (an arrow), on its
 * way (`DownloadRing`, pressed to cancel), on the device (the bin the app
 * deletes with everywhere, to remove it), or failed (a warning, pressed to
 * try again).
 */
function DownloadButtonBase({ episode, onDownload, onRemove }: DownloadButtonProps) {
  const tokens = useThemeTokens();
  const status = episode.downloadStatus;
  const busy = status === 'queued' || status === 'downloading';
  const muted = tokens['--color-muted-foreground'];

  const label =
    status === 'downloaded'
      ? 'Downloaded. Delete the download'
      : busy
        ? 'Downloading. Cancel'
        : status === 'failed'
          ? 'Download failed. Try again'
          : 'Download';

  const press = () => (status === 'downloaded' || busy ? onRemove(episode.id) : onDownload(episode.id));

  return (
    <Touchable
      className="items-center justify-center"
      style={{ width: BOX + 8, height: BOX + 8 }}
      hitSlop={4}
      haptic="tap"
      onPress={press}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {busy ? (
        <DownloadRing episodeId={episode.id} size={BOX} />
      ) : status === 'downloaded' ? (
        <Trash2 size={18} color={muted} />
      ) : status === 'failed' ? (
        <CircleAlert size={20} color={muted} />
      ) : (
        <Download size={20} color={muted} />
      )}
    </Touchable>
  );
}

export const DownloadButton = React.memo(DownloadButtonBase);
