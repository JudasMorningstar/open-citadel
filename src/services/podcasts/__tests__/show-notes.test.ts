import { describe, expect, it } from "vitest";

import { parseShowNotes, summarizeShowNotes } from "@/services/podcasts/show-notes";

describe("parseShowNotes", () => {
  it("splits paragraphs and list items and keeps inline styles", () => {
    const blocks = parseShowNotes(
      '<p>Hello <b>bold</b> and <a href="https://x.test/a">a link</a>.</p><ul><li>One</li><li>Two &amp; three</li></ul>',
    );
    expect(blocks.map((b) => b.kind)).toEqual(["paragraph", "item", "item"]);
    expect(blocks[0].spans).toEqual([
      { text: "Hello " },
      { text: "bold", bold: true },
      { text: " and " },
      { text: "a link", href: "https://x.test/a" },
      { text: "." },
    ]);
    expect(blocks[2].spans[0].text).toBe("Two & three");
  });

  it("turns timestamps into seekable runs", () => {
    const [block] = parseShowNotes("<p>(01:02:03) Intro, then 12:34 the good bit</p>");
    const seeks = block.spans.filter((s) => s.seekSec != null).map((s) => [s.text, s.seekSec]);
    expect(seeks).toEqual([
      ["01:02:03", 3723],
      ["12:34", 754],
    ]);
  });

  it("links bare urls without eating the full stop", () => {
    const [block] = parseShowNotes("Find us at https://example.com/show.");
    expect(block.spans.find((s) => s.href)?.text).toBe("https://example.com/show");
    expect(block.spans[block.spans.length - 1].text).toBe(".");
  });

  it("drops scripts and images", () => {
    expect(parseShowNotes('<p>Hi<img src="x"/><script>alert(1)</script></p>')).toEqual([
      { kind: "paragraph", spans: [{ text: "Hi" }] },
    ]);
  });

  it("reads plain text with blank lines as paragraphs", () => {
    expect(parseShowNotes("First\n\nSecond").length).toBe(2);
  });

  it("ignores javascript links", () => {
    const [block] = parseShowNotes('<a href="javascript:alert(1)">x</a>');
    expect(block.spans[0].href).toBeUndefined();
  });
});

describe("summarizeShowNotes", () => {
  it("returns one line of text, cut at a word", () => {
    const summary = summarizeShowNotes(`<p>${"word ".repeat(100)}</p>`, 50);
    expect(summary?.endsWith("…")).toBe(true);
    expect(summary!.length).toBeLessThanOrEqual(51);
  });
  it("is null for empty notes", () => {
    expect(summarizeShowNotes("<p> </p>")).toBeNull();
  });
});
