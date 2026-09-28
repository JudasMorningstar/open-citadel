import { describe, expect, it } from "vitest";

import {
  isFreshlyPublished,
  planEpisodeMerge,
  type StoredEpisodeKey,
} from "@/services/podcasts/episode-match";
import type { ParsedEpisode } from "@/services/podcasts/feed-parser";

function parsed(overrides: Partial<ParsedEpisode>): ParsedEpisode {
  return {
    guid: null,
    title: "Episode",
    description: null,
    link: null,
    pubDate: "2025-01-01T10:00:00.000Z",
    imageUrl: null,
    audioUrl: "https://cdn/x.mp3",
    mimeType: "audio/mpeg",
    durationSec: 1800,
    fileSize: null,
    chaptersUrl: null,
    transcriptUrl: null,
    transcriptType: null,
    chapters: [],
    ...overrides,
  };
}

function stored(overrides: Partial<StoredEpisodeKey>): StoredEpisodeKey {
  return {
    id: "s1",
    guid: null,
    audioUrl: "https://cdn/x.mp3",
    title: "Episode",
    pubDate: "2025-01-01T10:00:00.000Z",
    durationSec: 1800,
    mimeType: "audio/mpeg",
    ...overrides,
  };
}

describe("planEpisodeMerge", () => {
  it("matches on guid first", () => {
    const plan = planEpisodeMerge(
      [stored({ id: "a", guid: "g1", audioUrl: "https://old/a.mp3" })],
      [parsed({ guid: "g1", audioUrl: "https://new/a.mp3" })],
    );
    expect(plan.updates.map((u) => u.id)).toEqual(["a"]);
    expect(plan.inserts).toHaveLength(0);
  });

  it("falls back to the audio url when the guid changed", () => {
    const plan = planEpisodeMerge(
      [stored({ id: "a", guid: "old-guid" })],
      [parsed({ guid: "new-guid" })],
    );
    expect(plan.updates.map((u) => u.id)).toEqual(["a"]);
  });

  it("guesses a re-published episode by title, day and length", () => {
    const plan = planEpisodeMerge(
      [stored({ id: "a", guid: "old", audioUrl: "https://old/a.mp3", title: "The “Big” One" })],
      [
        parsed({
          guid: "new",
          audioUrl: "https://new/a.mp3",
          title: 'The "Big" One',
          pubDate: "2025-01-01T18:00:00.000Z",
          durationSec: 1900,
        }),
      ],
    );
    expect(plan.updates.map((u) => u.id)).toEqual(["a"]);
  });

  it("does not guess across different days", () => {
    const plan = planEpisodeMerge(
      [stored({ id: "a", guid: "old", audioUrl: "https://old/a.mp3" })],
      [parsed({ guid: "new", audioUrl: "https://new/a.mp3", pubDate: "2025-01-02T10:00:00.000Z" })],
    );
    expect(plan.inserts).toHaveLength(1);
  });

  it("drops an episode the feed lists twice", () => {
    const plan = planEpisodeMerge(
      [],
      [parsed({ guid: "g" }), parsed({ guid: "g", audioUrl: "https://cdn/y.mp3" })],
    );
    expect(plan.inserts).toHaveLength(1);
  });

  it("never matches two incoming episodes to one stored one", () => {
    const plan = planEpisodeMerge(
      [stored({ id: "a", guid: "g1" })],
      [
        parsed({ guid: "g1", audioUrl: "https://cdn/1.mp3" }),
        parsed({ guid: "g2", audioUrl: "https://cdn/x.mp3", pubDate: "2024-12-01T00:00:00.000Z" }),
      ],
    );
    expect(plan.updates).toHaveLength(1);
    expect(plan.inserts).toHaveLength(1);
  });
});

describe("isFreshlyPublished", () => {
  it("treats back-catalogue additions as old", () => {
    expect(isFreshlyPublished(parsed({ pubDate: "2020-01-01T00:00:00.000Z" }), "2025-01-01T00:00:00.000Z")).toBe(false);
    expect(isFreshlyPublished(parsed({ pubDate: "2025-02-01T00:00:00.000Z" }), "2025-01-01T00:00:00.000Z")).toBe(true);
    expect(isFreshlyPublished(parsed({ pubDate: null }), "2025-01-01T00:00:00.000Z")).toBe(true);
  });
});
