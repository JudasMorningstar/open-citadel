/**
 * Podcasting 2.0 chapter files (`podcast:chapters`).
 *
 * Many current feeds publish chapters as a JSON file beside the episode rather
 * than inline in the feed. AntennaPod fetches it when an episode is shown or
 * played; so does this, once, storing the result with the inline kind so
 * everything that draws chapters reads one table.
 */
import { count, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { podcastChapters, podcastEpisodes } from "@/db/schema";
import type { ParsedChapter } from "@/services/podcasts/feed-parser";
import { newId } from "@/services/podcasts/records";

/** The JSON chapters format, read defensively. Chapters marked `toc: false` are not listed. */
export function parseChaptersJson(json: unknown): ParsedChapter[] {
  const list = (json as { chapters?: unknown })?.chapters;
  if (!Array.isArray(list)) return [];
  const chapters: ParsedChapter[] = [];
  for (const raw of list) {
    const c = raw as { startTime?: unknown; title?: unknown; img?: unknown; url?: unknown; toc?: unknown };
    const start = typeof c.startTime === "number" ? c.startTime : Number(c.startTime);
    if (!Number.isFinite(start) || c.toc === false) continue;
    chapters.push({
      startSec: start,
      title: typeof c.title === "string" && c.title.trim() ? c.title.trim() : "Chapter",
      link: typeof c.url === "string" ? c.url : null,
      imageUrl: typeof c.img === "string" ? c.img : null,
    });
  }
  return chapters.sort((a, b) => a.startSec - b.startSec);
}

const inFlight = new Map<string, Promise<boolean>>();

/**
 * Fetches and stores an episode's chapter file if it has one and nothing is
 * stored yet. Resolves true when chapters were added. Never throws: chapters
 * are a nicety, and a missing file is not an error worth showing.
 */
export function ensureChapters(episodeId: string): Promise<boolean> {
  const running = inFlight.get(episodeId);
  if (running) return running;
  const job = (async () => {
    try {
      const [row] = await db
        .select({ url: podcastEpisodes.chaptersUrl })
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.id, episodeId))
        .limit(1);
      if (!row?.url) return false;
      const [{ n }] = await db.select({ n: count() }).from(podcastChapters).where(eq(podcastChapters.episodeId, episodeId));
      if (n > 0) return false;
      const response = await fetch(row.url);
      if (!response.ok) return false;
      const chapters = parseChaptersJson(await response.json());
      if (chapters.length === 0) return false;
      await db.insert(podcastChapters).values(chapters.map((c) => ({ id: newId(), episodeId, ...c })));
      return true;
    } catch {
      return false;
    } finally {
      inFlight.delete(episodeId);
    }
  })();
  inFlight.set(episodeId, job);
  return job;
}
