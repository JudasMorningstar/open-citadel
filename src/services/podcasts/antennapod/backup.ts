/** Opening an AntennaPod backup safely, and reading it whatever version wrote it. */
import { copyAsync, deleteAsync, makeDirectoryAsync } from "expo-file-system/legacy";
import { defaultDatabaseDirectory, openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";

import { num, str, type Row } from "@/services/podcasts/antennapod/codes";

const TEMP_NAME = "antennapod-import.db";
const LOCAL_FEED_PREFIX = "antennapod_local:";

export async function columns(source: SQLiteDatabase, table: string): Promise<Set<string>> {
  const rows = await source.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`);
  return new Set(rows.map((r) => r.name));
}

/** `table.name AS alias`, or `NULL AS alias` for a column this backup predates. */
export function pick(present: Set<string>, table: string, name: string, alias = name): string {
  return present.has(name) ? `${table}.${name} AS ${alias}` : `NULL AS ${alias}`;
}

/**
 * Copies the chosen file where expo-sqlite can open it. It is a copy, and it is
 * deleted afterwards: the listener's own file is never opened for writing.
 */
export async function openBackup(uri: string): Promise<SQLiteDatabase> {
  const dir = String(defaultDatabaseDirectory ?? "");
  const dirUri = dir.startsWith("file://") ? dir : `file://${dir}`;
  await makeDirectoryAsync(dirUri, { intermediates: true }).catch(() => {});
  const target = `${dirUri.replace(/\/+$/, "")}/${TEMP_NAME}`;
  await deleteAsync(target, { idempotent: true });
  await copyAsync({ from: uri, to: target });
  return openDatabaseAsync(TEMP_NAME, { useNewConnection: true });
}

export async function closeBackup(source: SQLiteDatabase | null): Promise<void> {
  if (!source) return;
  await source.closeAsync().catch(() => {});
  const dir = String(defaultDatabaseDirectory ?? "");
  const dirUri = dir.startsWith("file://") ? dir : `file://${dir}`;
  for (const suffix of ["", "-wal", "-shm", "-journal"]) {
    await deleteAsync(`${dirUri.replace(/\/+$/, "")}/${TEMP_NAME}${suffix}`, { idempotent: true }).catch(() => {});
  }
}

/**
 * The feeds worth bringing across, and how many were left behind because they
 * point at files on the old device.
 *
 * Followed shows first, so where AntennaPod holds one address twice (an
 * archived copy beside a live one) the live one is the copy kept: the address
 * is unique here, and a second insert would stop the import. A feed in state 1
 * was only ever previewed there, and is not part of the library.
 */
export function importableFeeds(feeds: Row[], hasState: boolean): { feeds: Row[]; skipped: number } {
  const seen = new Set<string>();
  let skipped = 0;
  const kept = [...feeds]
    .sort((a, b) => (hasState ? num(a.state) - num(b.state) : 0))
    .filter((f) => {
      const url = str(f.download_url);
      const state = hasState ? num(f.state) : 0;
      if (!url || url.startsWith(LOCAL_FEED_PREFIX)) {
        skipped += 1;
        return false;
      }
      if (state === 1 || seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  return { feeds: kept, skipped };
}

/** The episode columns read from a backup, with `NULL` for any this version predates. */
export function itemSelect(itemCols: Set<string>): string {
  return [
    "i.id AS item_id",
    "i.title AS title",
    "i.pubDate AS pub_date",
    "i.read AS read",
    "i.link AS link",
    "i.description AS description",
    pick(itemCols, "i", "item_identifier", "guid"),
    pick(itemCols, "i", "image_url", "item_image"),
    pick(itemCols, "i", "auto_download", "item_auto_download"),
    pick(itemCols, "i", "podcastindex_chapter_url", "chapters_url"),
    pick(itemCols, "i", "podcastindex_transcript_url", "transcript_url"),
    pick(itemCols, "i", "podcastindex_transcript_type", "transcript_type"),
    "m.duration AS duration",
    "m.download_url AS audio_url",
    "m.position AS position",
    "m.filesize AS filesize",
    "m.mime_type AS mime_type",
    "m.playback_completion_date AS completed",
    "m.played_duration AS played_duration",
    "m.last_played_time AS last_played",
  ].join(", ");
}
