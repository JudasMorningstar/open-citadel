import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import { CircleAlert, Download, Square, Trash2 } from '@/components/icons';
import { Touchable } from '@/components/ui/touchable';
import { useThemeTokens } from '@/hooks/use-theme-tokens';
import type { EpisodeItem } from '@/services/podcasts/records';
import { useDownloadProgress } from '@/stores/podcast-downloads';

const BOX = 32;
const STROKE = 2;

type DownloadButtonProps = {
  episode: Pick<EpisodeItem, 'id' | 'downloadStatus'>;
  onDownload: (episodeId: string) => void;
  /** Cancel a running download, or remove a finished one. */
  onRemove: (episodeId: string) => void;
};

/**
 * An episode's download, in four states: not downloaded (an arrow), on its
 * way (a square outline filling in as it goes, and a stop mark to cancel),
 * on the device (the bin the app deletes with everywhere, to remove it), or
 * failed (a warning, pressed to try again).
 *
 * The progress outline is square because every other mark in the app is; a
 * ring would be the one round thing on the row. It subscribes to its own
 * episode's progress only, so a download ticking never re-renders the list.
 */
function DownloadButtonBase({ episode, onDownload, onRemove }: DownloadButtonProps) {
  const tokens = useThemeTokens();
  const progress = useDownloadProgress(episode.id);
  const status = episode.downloadStatus;
  const busy = status === 'queued' || status === 'downloading';
  const muted = tokens['--color-muted-foreground'];
  const gold = tokens['--color-primary'];

  const label =
    status === 'downloaded'
      ? 'Downloaded. Delete the download'
      : busy
        ? 'Downloading. Cancel'
        : status === 'failed'
          ? 'Download failed. Try again'
          : 'Download';

  const press = () => (status === 'downloaded' || busy ? onRemove(episode.id) : onDownload(episode.id));
  const perimeter = (BOX - STROKE) * 4;
  const drawn = perimeter * (progress ?? 0);

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
        <View style={{ width: BOX, height: BOX }} className="items-center justify-center">
          <Svg width={BOX} height={BOX} style={{ position: 'absolute' }}>
            <Rect x={STROKE / 2} y={STROKE / 2} width={BOX - STROKE} height={BOX - STROKE} stroke={tokens['--color-surface-tertiary']} strokeWidth={STROKE} fill="none" />
            <Rect
              x={STROKE / 2}
              y={STROKE / 2}
              width={BOX - STROKE}
              height={BOX - STROKE}
              stroke={gold}
              strokeWidth={STROKE}
              fill="none"
              strokeDasharray={`${drawn} ${perimeter}`}
              strokeLinecap="butt"
            />
          </Svg>
          <Square size={10} color={gold} fill={gold} />
        </View>
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
