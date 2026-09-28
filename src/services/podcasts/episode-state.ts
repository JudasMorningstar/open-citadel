/**
 * Everything a listener can do to one episode besides queueing it: favourite
 * it, mark it played or seen, start it over, and save where they are.
 *
 * Every rule about what an action means lives here once. "Played" resets the
 * position and leaves Up Next, the way AntennaPod does it, whether it came from
 * a swipe, a menu or the end of the audio.
 */
import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { podcastEpisodes, podcastListeningDays } from "@/db/schema";
import { nowIso, type Episode } from "@/services/podcasts/records";
import { localDayString } from "@/utils/day";

export async function setFavorite(ids: string[], favorite: boolean): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(podcastEpisodes)
    .set({ isFavorite: favorite ? 1 : 0, updatedAt: nowIso() })
    .where(inArray(podcastEpisodes.id, ids));
}

/**
 * Played: the position goes back to the start, it leaves Up Next, and it is
 * stamped for the history. Unplayed: back on the list to be listened to, from
 * wherever it was left.
 */
export async function setPlayed(ids: string[], played: boolean): Promise<void> {
  if (ids.length === 0) return;
  const now = nowIso();
  await db
    .update(podcastEpisodes)
    .set(
      played
        ? { playState: "played", positionSec: 0, completedAt: now, queuePosition: null, updatedAt: now }
        : { playState: "unplayed", completedAt: null, updatedAt: now },
    )
    .where(inArray(podcastEpisodes.id, ids));
}

/** Out of the inbox without being listened to (AntennaPod's "remove from inbox"). */
export async function markSeen(ids: string[] | "all"): Promise<void> {
  await db
    .update(podcastEpisodes)
    .set({ playState: "unplayed", updatedAt: nowIso() })
    .where(
      ids === "all"
        ? eq(podcastEpisodes.playState, "new")
        : and(eq(podcastEpisodes.playState, "new"), inArray(podcastEpisodes.id, ids)),
    );
}

/** AntennaPod's "reset playback position": back to the start, still unplayed. */
export async function resetPosition(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(podcastEpisodes)
    .set({ positionSec: 0, updatedAt: nowIso() })
    .where(inArray(podcastEpisodes.id, ids));
}

/** Everything new in one show, out of the inbox ("remove all from inbox" on a show). */
export async function markShowSeen(podcastId: string): Promise<void> {
  await db
    .update(podcastEpisodes)
    .set({ playState: "unplayed", updatedAt: nowIso() })
    .where(and(eq(podcastEpisodes.podcastId, podcastId), eq(podcastEpisodes.playState, "new")));
}

/**
 * Where the listener is, and how much they actually heard since the last save.
 *
 * `listenedSec` is time spent listening, not distance moved: a skip forward is
 * not an hour of listening. It accumulates onto the episode (AntennaPod's
 * `played_duration`) and onto today's row for the stats to come.
 */
export async function saveProgress(
  episode: Pick<Episode, "id" | "podcastId">,
  positionSec: number,
  listenedSec: number,
): Promise<void> {
  const now = nowIso();
  const listened = Math.max(0, listenedSec);
  await db
    .update(podcastEpisodes)
    .set({
      positionSec: Math.max(0, positionSec),
      playedDurationSec: sql`${podcastEpisodes.playedDurationSec} + ${listened}`,
      lastPlayedAt: now,
      // Listening takes it out of the inbox, and listening again to a played
      // episode puts it back in progress (it is finished again at its end).
      playState: sql`case when ${listened} > 0 or ${podcastEpisodes.playState} = 'new' then 'unplayed' else ${podcastEpisodes.playState} end`,
      updatedAt: now,
    })
    .where(eq(podcastEpisodes.id, episode.id));

  if (listened <= 0) return;
  const day = localDayString();
  await db
    .insert(podcastListeningDays)
    .values({
      id: `${day}:${episode.id}`,
      day,
      episodeId: episode.id,
      podcastId: episode.podcastId,
      seconds: listened,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: podcastListeningDays.id,
      set: { seconds: sql`${podcastListeningDays.seconds} + ${listened}`, updatedAt: now },
    });
}
