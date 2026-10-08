/**
 * Shows: the list of what someone follows, one show's details and settings,
 * and following or leaving one.
 */
import { and, asc, eq, inArray, lt, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { podcastChapters, podcastEpisodes, podcasts } from "@/db/schema";
import { nowIso, type Podcast, type ShowItem } from "@/services/podcasts/records";

const NEW_COUNT = sql<number>`(
  select count(*) from ${podcastEpisodes}
  where ${podcastEpisodes.podcastId} = ${podcasts.id} and ${podcastEpisodes.playState} = 'new'
)`.mapWith(Number);

/** Everything followed, the shows with something new in them first, then by name. */
export async function listSubscribedShows(): Promise<ShowItem[]> {
  const rows = await db
    .select({ show: podcasts, newCount: NEW_COUNT })
    .from(podcasts)
    .where(eq(podcasts.state, "subscribed"))
    .orderBy(
      sql`case when ${NEW_COUNT} > 0 then 0 else 1 end`,
      asc(sql`lower(coalesce(nullif(trim(${podcasts.customTitle}), ''), ${podcasts.title}))`),
    );
  return rows.map((r) => ({ ...r.show, newCount: r.newCount }));
}

export async function getShow(id: string): Promise<Podcast | null> {
  const rows = await db.select().from(podcasts).where(eq(podcasts.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findShowByFeedUrl(feedUrl: string): Promise<Podcast | null> {
  const rows = await db.select().from(podcasts).where(eq(podcasts.feedUrl, feedUrl)).limit(1);
  return rows[0] ?? null;
}

/**
 * What identifies the shows already followed: feed addresses for search
 * results, and titles for chart entries, which only carry an Apple id (the
 * same title match AntennaPod uses to leave followed shows off its chart).
 */
export async function followedShowKeys(): Promise<{ feedUrls: Set<string>; titles: Set<string> }> {
  const rows = await db
    .select({ feedUrl: podcasts.feedUrl, title: podcasts.title })
    .from(podcasts)
    .where(eq(podcasts.state, "subscribed"));
  return {
    feedUrls: new Set(rows.map((r) => r.feedUrl)),
    titles: new Set(rows.map((r) => r.title.trim().toLowerCase())),
  };
}

/** The per-show settings a listener can change. */
export type ShowSettings = Pick<
  Podcast,
  | "customTitle"
  | "keepUpdated"
  | "autoDownload"
  | "autoDelete"
  | "newEpisodesAction"
  | "playbackSpeed"
  | "skipIntroSec"
  | "skipEndingSec"
  | "episodeSort"
>;

export async function updateShowSettings(id: string, patch: Partial<ShowSettings>): Promise<void> {
  await db
    .update(podcasts)
    .set({ ...patch, updatedAt: nowIso() })
    .where(eq(podcasts.id, id));
}

/**
 * Following a show that was only being looked at. Its newest episode goes to
 * the inbox so there is something to start with; the rest wait on the show's
 * page rather than burying the inbox under a back catalogue.
 */
export async function subscribe(id: string): Promise<void> {
  const now = nowIso();
  await db
    .update(podcasts)
    .set({ state: "subscribed", subscribedAt: now, updatedAt: now })
    .where(eq(podcasts.id, id));
  const newest = await db
    .select({ id: podcastEpisodes.id })
    .from(podcastEpisodes)
    .where(and(eq(podcastEpisodes.podcastId, id), eq(podcastEpisodes.playState, "unplayed")))
    .orderBy(sql`${podcastEpisodes.pubDate} desc`)
    .limit(1);
  if (newest[0] && (await startedCount(id)) === 0) {
    await db
      .update(podcastEpisodes)
      .set({ playState: "new", updatedAt: now })
      .where(eq(podcastEpisodes.id, newest[0].id));
  }
}

async function startedCount(podcastId: string): Promise<number> {
  const rows = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(podcastEpisodes)
    .where(and(eq(podcastEpisodes.podcastId, podcastId), sql`${podcastEpisodes.positionSec} > 0`));
  return rows[0]?.n ?? 0;
}

/**
 * Removes a show and everything under it from this device. The caller deletes
 * downloaded files first (see `downloads.deleteShowDownloads`): the rows are
 * the only record of which files are whose.
 *
 * The listening history in `podcast_listening_days` is kept. It records time
 * that was spent, and unfollowing a show does not unspend it.
 */
export async function deleteShow(id: string): Promise<void> {
  const episodeIds = (
    await db.select({ id: podcastEpisodes.id }).from(podcastEpisodes).where(eq(podcastEpisodes.podcastId, id))
  ).map((r) => r.id);
  db.transaction((tx) => {
    for (let i = 0; i < episodeIds.length; i += 500) {
      tx.delete(podcastChapters).where(inArray(podcastChapters.episodeId, episodeIds.slice(i, i + 500))).run();
    }
    tx.delete(podcastEpisodes).where(eq(podcastEpisodes.podcastId, id)).run();
    tx.delete(podcasts).where(eq(podcasts.id, id)).run();
  });
}

/**
 * Shows that were opened from Explore and never followed. AntennaPod keeps
 * them for a while so a listener can come back to one; so do we, for a week,
 * unless something about them is still in use: an episode started, queued,
 * favourited or downloaded.
 */
export async function pruneStalePreviews(): Promise<string[]> {
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const stale = await db
    .select({ id: podcasts.id })
    .from(podcasts)
    .where(
      and(
        eq(podcasts.state, "preview"),
        lt(podcasts.updatedAt, cutoff),
        sql`not exists (
          select 1 from ${podcastEpisodes}
          where ${podcastEpisodes.podcastId} = ${podcasts.id}
            and (${podcastEpisodes.positionSec} > 0
              or ${podcastEpisodes.queuePosition} is not null
              or ${podcastEpisodes.isFavorite} = 1
              or ${podcastEpisodes.downloadStatus} != 'none')
        )`,
      ),
    );
  for (const { id } of stale) await deleteShow(id);
  return stale.map((s) => s.id);
}
