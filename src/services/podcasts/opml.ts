/**
 * OPML: the list-of-feeds file every podcast app can read and write.
 *
 * It carries subscriptions and nothing else, so it is the fallback door in
 * (for a listener who exported OPML from AntennaPod, or comes from another app
 * entirely) and the way out: the same file AntennaPod's own "Import OPML"
 * reads, so nobody's library is locked in here either.
 */
import { XMLParser } from "fast-xml-parser";

import { addShowFromFeed } from "@/services/podcasts/feed-sync";
import type { Podcast } from "@/services/podcasts/records";
import type { ImportProgress } from "@/services/podcasts/antennapod-import";

export type OpmlFeed = { title: string; feedUrl: string };

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  parseAttributeValue: false,
  isArray: (name) => name === "outline",
});

type Outline = { "@_xmlUrl"?: string; "@_text"?: string; "@_title"?: string; outline?: Outline[] };

/** Every feed in the file, however deeply the exporting app nested its folders. */
export function parseOpml(xml: string): OpmlFeed[] {
  const doc = parser.parse(xml) as { opml?: { body?: { outline?: Outline[] } } };
  const found: OpmlFeed[] = [];
  const seen = new Set<string>();
  const walk = (outlines: Outline[] | undefined) => {
    for (const outline of outlines ?? []) {
      const url = outline["@_xmlUrl"]?.trim();
      if (url && !seen.has(url)) {
        seen.add(url);
        found.push({ title: outline["@_title"] ?? outline["@_text"] ?? url, feedUrl: url });
      }
      walk(outline.outline);
    }
  };
  walk(doc.opml?.body?.outline);
  return found;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOpml(shows: Pick<Podcast, "title" | "customTitle" | "feedUrl" | "link">[]): string {
  const outlines = shows
    .map((s) => {
      const title = escapeXml(s.customTitle?.trim() || s.title);
      const html = s.link ? ` htmlUrl="${escapeXml(s.link)}"` : "";
      return `    <outline text="${title}" title="${title}" type="rss" xmlUrl="${escapeXml(s.feedUrl)}"${html} />`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Open Citadel podcasts</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>
`;
}

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
  await writeAsStringAsync(uri, buildOpml(shows));
  await shareAsync(uri, { mimeType: "text/x-opml", dialogTitle: "Export podcasts", UTI: "public.xml" });
  return shows.length;
}
