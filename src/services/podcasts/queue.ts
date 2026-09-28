/** Up Next: its order, and adding, moving and removing episodes. */
import { asc, eq, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { podcastEpisodes } from "@/db/schema";
import { markSeen } from "@/services/podcasts/episode-state";
import { nowIso } from "@/services/podcasts/records";

async function queueIds(): Promise<string[]> {
  const rows = await db
    .select({ id: podcastEpisodes.id })
    .from(podcastEpisodes)
    .where(isNotNull(podcastEpisodes.queuePosition))
    .orderBy(asc(podcastEpisodes.queuePosition));
  return rows.map((r) => r.id);
}

/** Writes Up Next back in the given order, 0..n, and clears anything not in it. */
async function writeQueue(ordered: string[]): Promise<void> {
  const now = nowIso();
  db.transaction((tx) => {
    tx.update(podcastEpisodes)
      .set({ queuePosition: null })
      .where(isNotNull(podcastEpisodes.queuePosition))
      .run();
    ordered.forEach((id, index) => {
      tx.update(podcastEpisodes)
        .set({ queuePosition: index, updatedAt: now })
        .where(eq(podcastEpisodes.id, id))
        .run();
    });
  });
}

/**
 * Adds episodes to Up Next, at the front ("play next") or the back. Anything
 * already queued moves rather than appearing twice. Queuing an episode also
 * takes it out of the inbox: deciding to listen is the decision the inbox is
 * asking for.
 */
export async function enqueue(ids: string[], where: "next" | "last"): Promise<void> {
  if (ids.length === 0) return;
  const rest = (await queueIds()).filter((id) => !ids.includes(id));
  await writeQueue(where === "next" ? [...ids, ...rest] : [...rest, ...ids]);
  await markSeen(ids);
}

export async function dequeue(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await db
    .update(podcastEpisodes)
    .set({ queuePosition: null, updatedAt: nowIso() })
    .where(inArray(podcastEpisodes.id, ids));
}

export async function moveInQueue(id: string, toIndex: number): Promise<void> {
  const ordered = (await queueIds()).filter((q) => q !== id);
  ordered.splice(Math.max(0, Math.min(toIndex, ordered.length)), 0, id);
  await writeQueue(ordered);
}

export async function clearQueue(): Promise<void> {
  await writeQueue([]);
}

/** The queue as ids, in order, for the player to mirror. */
export async function upNextIds(): Promise<string[]> {
  return queueIds();
}
