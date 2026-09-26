/** The scalar values feeds write in more than one way: durations, chapter starts and dates. Pure. */

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

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** The US zone names RFC 822 allows, in minutes east of UTC. */
const ZONES: Record<string, number> = {
  UT: 0, UTC: 0, GMT: 0, Z: 0,
  EST: -300, EDT: -240, CST: -360, CDT: -300,
  MST: -420, MDT: -360, PST: -480, PDT: -420,
};

/**
 * An RFC 822 `pubDate`, parsed by hand.
 *
 * Hermes' `Date.parse` is reliable for ISO 8601 and little else, and podcast
 * feeds are RFC 822 almost without exception — often loosely: full month
 * names, a missing weekday, two-digit years, seconds left off, a zone name
 * rather than an offset. Returns ISO 8601, or null for a date that cannot be
 * read (an episode with no date sorts last rather than pretending to be new).
 */
export function parseFeedDate(raw: string | null): string | null {
  if (!raw) return null;
  const value = raw.trim();
  const match = value.match(
    /(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s+(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([+-]\d{2}:?\d{2}|[A-Za-z]{1,4})?/,
  );
  if (match) {
    const [, day, mon, yearRaw, hh, mm, ss, zone] = match;
    const month = MONTHS[mon.toLowerCase()];
    if (month !== undefined) {
      let year = Number(yearRaw);
      if (year < 100) year += year < 70 ? 2000 : 1900;
      let offset = 0;
      if (zone) {
        if (/^[+-]/.test(zone)) {
          const digits = zone.replace(":", "");
          const sign = digits.startsWith("-") ? -1 : 1;
          offset = sign * (Number(digits.slice(1, 3)) * 60 + Number(digits.slice(3, 5)));
        } else {
          offset = ZONES[zone.toUpperCase()] ?? 0;
        }
      }
      const utc =
        Date.UTC(year, month, Number(day), Number(hh), Number(mm), Number(ss ?? 0)) -
        offset * 60_000;
      if (Number.isFinite(utc)) return new Date(utc).toISOString();
    }
  }
  const fallback = Date.parse(value);
  return Number.isFinite(fallback) ? new Date(fallback).toISOString() : null;
}
