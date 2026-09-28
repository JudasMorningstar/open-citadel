/** The scalar values podcast feeds write in more than one way: durations and chapter starts. Pure. */

export function positiveInt(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * `itunes:duration` in any of the shapes feeds actually use: `HH:MM:SS`,
 * `MM:SS`, or plain seconds (sometimes with a fraction).
 */
export function parseDuration(raw: string | null): number {
  if (!raw) return 0;
  const value = raw.trim();
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value));
  const parts = value.split(":").map((p) => Number(p));
  if (parts.some((p) => !Number.isFinite(p))) return 0;
  return Math.round(parts.reduce((total, part) => total * 60 + part, 0));
}

/** Podlove chapter starts: `HH:MM:SS.mmm`, `MM:SS` or seconds. */
export function parseChapterStart(raw: string | null): number | null {
  if (!raw) return null;
  const parts = raw.trim().split(":").map((p) => Number(p));
  if (parts.length === 0 || parts.some((p) => !Number.isFinite(p))) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}
