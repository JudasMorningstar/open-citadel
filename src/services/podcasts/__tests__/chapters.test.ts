import { describe, expect, it, vi } from "vitest";

import { parseChaptersJson } from "@/services/podcasts/chapters";

// The module's database side is not under test here.
vi.mock("@/db/client", () => ({ db: {} }));
vi.mock("expo-crypto", () => ({ randomUUID: () => "id" }));

describe("parseChaptersJson", () => {
  it("reads, sorts and skips hidden chapters", () => {
    expect(
      parseChaptersJson({
        version: "1.2.0",
        chapters: [
          { startTime: 120, title: "Second", img: "https://i/2.jpg" },
          { startTime: 0, title: "Intro", url: "https://x" },
          { startTime: 60, title: "Hidden", toc: false },
          { startTime: "bad" },
        ],
      }),
    ).toEqual([
      { startSec: 0, title: "Intro", link: "https://x", imageUrl: null },
      { startSec: 120, title: "Second", link: null, imageUrl: "https://i/2.jpg" },
    ]);
  });

  it("returns nothing for anything else", () => {
    expect(parseChaptersJson(null)).toEqual([]);
    expect(parseChaptersJson({ chapters: "no" })).toEqual([]);
  });
});
