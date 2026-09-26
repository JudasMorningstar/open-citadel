/** Bringing one AntennaPod show and its episodes across, merged with the copy here if there is one. */
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { podcastChapters, podcastEpisodes, podcasts } from "@/db/schema";
import type { ImportSummary } from "@/services/podcasts/antennapod/types";
import { listenerValuesFrom, msToIso, num, showValuesFrom, str, type Row } from "@/services/podcasts/antennapod/codes";
import { chunk, INSERT_CHUNK, newId, nowIso, yieldToUi, type NewEpisode } from "@/services/podcasts/records";
import { summarizeShowNotes } from "@/services/podcasts/show-notes";

export async function importFeed(
  feed: Row,
  feedCols: Set<string>,
  items: Row[],
  chapters: Row[],
  favoriteIds: Set<number>,
  idMap: Map<number, string>,
  summary: ImportSummary,
): Promise<void> {
  const now = nowIso();
  const feedUrl = str(feed.download_url)!;
  const showValues = showValuesFrom(feed, feedCols.has("state"), now);

  const existing = (await db.select().from(podcasts).where(eq(podcasts.feedUrl, feedUrl)).limit(1))[0];
  const podcastId = existing?.id ?? newId();
  if (existing) {
    await db
      .update(podcasts)
      .set({ ...showValues, subscribedAt: existing.subscribedAt ?? now })
      .where(eq(podcasts.id, podcastId));
  } else {
    await db.insert(podcasts).values({ id: podcastId, feedUrl, ...showValues, subscribedAt: now, createdAt: now });
  }

  const stored = existing
    ? await db
        .select({
          id: podcastEpisodes.id,
          guid: podcastEpisodes.guid,
          audioUrl: podcastEpisodes.audioUrl,
          lastPlayedAt: podcastEpisodes.lastPlayedAt,
        })
        .from(podcastEpisodes)
        .where(eq(podcastEpisodes.podcastId, podcastId))
    : [];
  const byGuid = new Map(stored.filter((s) => s.guid).map((s) => [s.guid!, s]));
  const byUrl = new Map(stored.map((s) => [s.audioUrl, s]));

  const inserts: NewEpisode[] = [];
  const updates: { id: string; values: Partial<NewEpisode> }[] = [];
  for (const item of items) {
    const audioUrl = str(item.audio_url);
    if (!audioUrl) continue;
    const apId = num(item.item_id);
    const listener = listenerValuesFrom(item, favoriteIds.has(apId));
    if (listener.playState === "played") summary.played += 1;
    else if (listener.positionSec > 0) summary.inProgress += 1;
    if (listener.isFavorite) summary.favorites += 1;

    const guid = str(item.guid);
    const match = (guid ? byGuid.get(guid) : undefined) ?? byUrl.get(audioUrl);
    if (match) {
      idMap.set(apId, match.id);
      if (!match.lastPlayedAt || (listener.lastPlayedAt && listener.lastPlayedAt > match.lastPlayedAt)) {
        updates.push({ id: match.id, values: { ...listener, updatedAt: now } });
      }
      continue;
    }
    const id = newId();
    idMap.set(apId, id);
    const description = str(item.description);
    inserts.push({
      id,
      podcastId,
      guid,
      title: str(item.title) ?? "Untitled episode",
      description,
      summary: summarizeShowNotes(description),
      link: str(item.link),
      pubDate: msToIso(item.pub_date),
      imageUrl: str(item.item_image),
      audioUrl,
      mimeType: str(item.mime_type),
      durationSec: Math.round(num(item.duration) / 1000),
      fileSize: num(item.filesize) > 0 ? num(item.filesize) : null,
      chaptersUrl: str(item.chapters_url),
      transcriptUrl: str(item.transcript_url),
      transcriptType: str(item.transcript_type),
      ...listener,
      addedAt: now,
      updatedAt: now,
    });
  }

  for (const batch of chunk(inserts, INSERT_CHUNK)) {
    db.insert(podcastEpisodes).values(batch).run();
    await yieldToUi();
  }
  if (updates.length > 0) {
    db.transaction((tx) => {
      for (const u of updates) tx.update(podcastEpisodes).set(u.values).where(eq(podcastEpisodes.id, u.id)).run();
    });
  }
  summary.episodes += inserts.length + updates.length;

  const insertedIds = new Set(inserts.map((i) => i.id));
  const chapterRows = chapters
    .map((c) => ({ episodeId: idMap.get(num(c.item_id)), c }))
    .filter((x): x is { episodeId: string; c: Row } => !!x.episodeId && insertedIds.has(x.episodeId))
    .map(({ episodeId, c }) => ({
      id: newId(),
      episodeId,
      startSec: num(c.start) / 1000,
      title: str(c.title) ?? "Chapter",
      link: str(c.link),
      imageUrl: str(c.image_url),
    }));
  for (const batch of chunk(chapterRows, 100)) db.insert(podcastChapters).values(batch).run();
}
