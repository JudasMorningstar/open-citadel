import { describe, expect, it, vi } from "vitest";

import { buildOpml, parseOpml } from "@/services/feeds/opml";

// Hoisted above the imports by vitest: the parser never touches the network.
vi.mock("@/services/podcasts/feed-sync", () => ({ addShowFromFeed: vi.fn() }));

describe("opml", () => {
  it("reads nested folders and skips duplicates", () => {
    const feeds = parseOpml(`<?xml version="1.0"?>
      <opml version="1.0"><head/><body>
        <outline text="Folder">
          <outline text="A &amp; B" type="rss" xmlUrl="https://a.test/feed"/>
          <outline title="C" xmlUrl="https://c.test/feed"/>
        </outline>
        <outline text="A again" xmlUrl="https://a.test/feed"/>
      </body></opml>`);
    expect(feeds).toEqual([
      { title: "A & B", feedUrl: "https://a.test/feed" },
      { title: "C", feedUrl: "https://c.test/feed" },
    ]);
  });

  it("round-trips what it writes", () => {
    const xml = buildOpml("Test", [{ title: "Q&A <Live>", feedUrl: "https://q.test/?a=1&b=2", siteUrl: null }]);
    expect(parseOpml(xml)).toEqual([{ title: "Q&A <Live>", feedUrl: "https://q.test/?a=1&b=2" }]);
  });
});
