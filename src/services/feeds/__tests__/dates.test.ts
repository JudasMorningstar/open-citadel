import { describe, expect, it } from "vitest";

import { parseFeedDate } from "@/services/feeds/dates";

describe("parseFeedDate", () => {
  it("reads ISO dates too", () => {
    expect(parseFeedDate("2024-05-06T07:08:09Z")).toBe("2024-05-06T07:08:09.000Z");
  });
  it("returns null for nonsense", () => {
    expect(parseFeedDate("soon")).toBeNull();
  });
});
