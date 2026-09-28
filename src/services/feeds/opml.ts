/**
 * OPML: the list-of-feeds file every feed reader and podcast app can read
 * and write. It carries subscriptions and nothing else, which makes it the
 * door in from another app and the way out to one. Shared by podcasts and
 * blogs. Pure.
 */
import { XMLParser } from "fast-xml-parser";

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

/** An OPML 2.0 file listing `feeds`, which any feed reader or podcast app can import. */
export function buildOpml(documentTitle: string, feeds: { title: string; feedUrl: string; siteUrl: string | null }[]): string {
  const outlines = feeds
    .map((f) => {
      const title = escapeXml(f.title);
      const html = f.siteUrl ? ` htmlUrl="${escapeXml(f.siteUrl)}"` : "";
      return `    <outline text="${title}" title="${title}" type="rss" xmlUrl="${escapeXml(f.feedUrl)}"${html} />`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(documentTitle)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${outlines}
  </body>
</opml>
`;
}
