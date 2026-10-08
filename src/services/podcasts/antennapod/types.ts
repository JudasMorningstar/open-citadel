/** What an import reports while it runs, and when it is done. */

export type ImportProgress = { done: number; total: number; current: string | null };

export type ImportSummary = {
  shows: number;
  episodes: number;
  played: number;
  inProgress: number;
  favorites: number;
  queued: number;
  /** Local-folder feeds, which point at files on the old device. */
  skipped: number;
};
