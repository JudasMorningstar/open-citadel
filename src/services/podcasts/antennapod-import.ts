/**
 * Bringing an AntennaPod library across.
 *
 * AntennaPod's "Export database" (Settings → Import/Export) writes its whole
 * SQLite database to a file. That file is the only export that carries what
 * a listener has actually done: which episodes they finished, how far into the
 * others they are, what they favourited, their queue in order, how long they
 * spent listening, and each show's own settings. OPML only carries the list
 * of feeds. So the database is the main door and OPML the fallback.
 *
 * The backup is read column by column rather than trusted to match one
 * version: AntennaPod has added columns over the years (`state` in 3.5,
 * transcripts, new-episode actions), and a backup from an older version is
 * still a real library. Anything missing takes the default.
 *
 * What cannot come across: downloaded files (they live in AntennaPod's private
 * storage) and the app-wide preferences (those are not in the database), and
 * local-folder "feeds", which point at files on the old device.
 */
import { eq } from "drizzle-orm";
import type { SQLiteDatabase } from "expo-sqlite";

import { db } from "@/db/client";
import { podcastEpisodes } from "@/db/schema";
import {
  closeBackup,
  columns,
  importableFeeds,
  itemSelect,
  openBackup,
  pick,
} from "@/services/podcasts/antennapod/backup";
import { num, str, type Row } from "@/services/podcasts/antennapod/codes";
import { importFeed } from "@/services/podcasts/antennapod/import-feed";
import type { ImportProgress, ImportSummary } from "@/services/podcasts/antennapod/types";
import { upNextIds } from "@/services/podcasts/queue";
import { yieldToUi } from "@/services/podcasts/records";

export type { ImportProgress, ImportSummary } from "@/services/podcasts/antennapod/types";

export class NotAnAntennaPodBackup extends Error {
  constructor() {
    super("This file is not an AntennaPod database export.");
  }
}

/**
 * Imports an AntennaPod database export. A show that is already here is merged
 * rather than duplicated: its episodes are matched and whichever copy was
 * listened to more recently wins.
 */
export async function importAntennaPodBackup(
  uri: string,
  onProgress: (progress: ImportProgress) => void,
): Promise<ImportSummary> {
  const summary: ImportSummary = { shows: 0, episodes: 0, played: 0, inProgress: 0, favorites: 0, queued: 0, skipped: 0 };
  let source: SQLiteDatabase | null = null;
  try {
    try {
      source = await openBackup(uri);
      await source.getFirstAsync("SELECT id FROM Feeds LIMIT 1");
    } catch {
      throw new NotAnAntennaPodBackup();
    }

    const feedCols = await columns(source, "Feeds");
    const itemCols = await columns(source, "FeedItems");
    const chapterCols = await columns(source, "SimpleChapters");
    const feeds = await source.getAllAsync<Row>(`SELECT * FROM Feeds`);
    const favoriteIds = new Set(
      (await source.getAllAsync<Row>(`SELECT feeditem FROM Favorites`).catch(() => [])).map((r) => num(r.feeditem)),
    );
    const queueOrder = (await source.getAllAsync<Row>(`SELECT feeditem FROM Queue ORDER BY id`).catch(() => [])).map(
      (r) => num(r.feeditem),
    );
    /** AntennaPod item id → our episode id, for the queue at the end. */
    const idMap = new Map<number, string>();

    const { feeds: importable, skipped } = importableFeeds(feeds, feedCols.has("state"));
    summary.skipped = skipped;
    const select = itemSelect(itemCols);

    for (const [index, feed] of importable.entries()) {
      const title = str(feed.custom_title) ?? str(feed.title) ?? "Untitled podcast";
      onProgress({ done: index, total: importable.length, current: title });
      const items = await source.getAllAsync<Row>(
        `SELECT ${select} FROM FeedItems i JOIN FeedMedia m ON m.feeditem = i.id WHERE i.feed = ?`,
        [num(feed.id)],
      );
      const chapters = await source
        .getAllAsync<Row>(
          `SELECT c.feeditem AS item_id, c.start AS start, c.title AS title, ${pick(chapterCols, "c", "link")}, ${pick(chapterCols, "c", "image_url")}
           FROM SimpleChapters c JOIN FeedItems i ON i.id = c.feeditem WHERE i.feed = ?`,
          [num(feed.id)],
        )
        .catch(() => [] as Row[]);
      await importFeed(feed, feedCols, items, chapters, favoriteIds, idMap, summary);
      summary.shows += 1;
      await yieldToUi();
    }

    const imported = queueOrder.map((id) => idMap.get(id)).filter((id): id is string => !!id);
    if (imported.length > 0) {
      const existing = (await upNextIds()).filter((id) => !imported.includes(id));
      const ordered = [...existing, ...imported];
      db.transaction((tx) => {
        ordered.forEach((id, position) => {
          tx.update(podcastEpisodes).set({ queuePosition: position }).where(eq(podcastEpisodes.id, id)).run();
        });
      });
      summary.queued = imported.length;
    }
    onProgress({ done: importable.length, total: importable.length, current: null });
    return summary;
  } finally {
    await closeBackup(source);
  }
}
