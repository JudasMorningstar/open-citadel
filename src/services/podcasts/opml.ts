/**
 * OPML: the list-of-feeds file every podcast app can read and write.
 *
 * It carries subscriptions and nothing else, so it is the fallback door in
 * (for a listener who exported OPML from AntennaPod, or comes from another app
 * entirely) and the way out: the same file AntennaPod's own "Import OPML"
 * reads, so nobody's library is locked in here either.
 */
import { buildOpml, type OpmlFeed } from "@/services/feeds/opml";
import { addShowFromFeed } from "@/services/podcasts/feed-sync";
import type { ImportProgress } from "@/services/podcasts/antennapod-import";

export type OpmlImportResult = { added: number; failed: OpmlFeed[] };

/** Follows every feed in the file, four at a time, carrying on past any that fail. */
export async function importOpml(
  feeds: OpmlFeed[],
  onProgress: (progress: ImportProgress) => void,
): Promise<OpmlImportResult> {
  const result: OpmlImportResult = { added: 0, failed: [] };
  const pending = [...feeds];
  let done = 0;
  await Promise.all(
    Array.from({ length: Math.min(4, pending.length) }, async () => {
      while (pending.length > 0) {
        const feed = pending.shift()!;
        onProgress({ done, total: feeds.length, current: feed.title });
        try {
          await addShowFromFeed(feed.feedUrl, "subscribed");
          result.added += 1;
        } catch {
          result.failed.push(feed);
        }
        done += 1;
      }
    }),
  );
  onProgress({ done: feeds.length, total: feeds.length, current: null });
  return result;
}

/**
 * Writes every followed show to an OPML file and opens the share sheet on it,
 * so the list can go to AntennaPod or anywhere else. Returns how many shows
 * went into it.
 */
export async function exportOpml(): Promise<number> {
  // Loaded on use: this module is otherwise pure, and its tests run without a device.
  const { cacheDirectory, writeAsStringAsync } = await import("expo-file-system/legacy");
  const { shareAsync } = await import("expo-sharing");
  const { listSubscribedShows } = await import("@/services/podcasts/shows");
  const shows = await listSubscribedShows();
  if (shows.length === 0) return 0;
  const uri = `${cacheDirectory}open-citadel-podcasts.opml`;
  await writeAsStringAsync(
    uri,
    buildOpml(
      "Open Citadel podcasts",
      shows.map((s) => ({ title: s.customTitle?.trim() || s.title, feedUrl: s.feedUrl, siteUrl: s.link })),
    ),
  );
  await shareAsync(uri, { mimeType: "text/x-opml", dialogTitle: "Export podcasts", UTI: "public.xml" });
  return shows.length;
}
