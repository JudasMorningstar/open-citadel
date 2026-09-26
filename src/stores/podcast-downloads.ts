import { create } from 'zustand';

/**
 * How far each running download has got, 0..1.
 *
 * Its own store because it ticks several times a second per download. Only
 * the one progress ring drawing a given episode subscribes to its entry (see
 * `useDownloadProgress`), so a download moving never re-renders a list.
 */
type DownloadProgressState = {
  progress: Record<string, number>;
  setProgress: (episodeId: string, fraction: number) => void;
  clear: (episodeId: string) => void;
};

export const usePodcastDownloads = create<DownloadProgressState>((set) => ({
  progress: {},
  setProgress: (episodeId, fraction) =>
    set((s) => ({ progress: { ...s.progress, [episodeId]: fraction } })),
  clear: (episodeId) =>
    set((s) => {
      if (!(episodeId in s.progress)) return s;
      const { [episodeId]: _done, ...rest } = s.progress;
      return { progress: rest };
    }),
}));

/** One episode's progress, or null when it is not downloading. */
export function useDownloadProgress(episodeId: string): number | null {
  return usePodcastDownloads((s) => s.progress[episodeId] ?? null);
}
