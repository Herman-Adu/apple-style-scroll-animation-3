import { describe, expect, it } from "vitest";

import {
  SECTION_OFFSET,
  getActiveSectionId,
  isScrolledToBottom,
} from "@/hooks/use-active-section";

describe("use-active-section helpers", () => {
  it("detects bottom-of-page with tolerance", () => {
    expect(isScrolledToBottom(600, 400, 1001)).toBe(true);
    expect(isScrolledToBottom(600, 398, 1001)).toBe(false);
  });

  it("returns the last section at bottom", () => {
    const active = getActiveSectionId({
      presentIds: ["overview", "specs", "faq"],
      offset: SECTION_OFFSET,
      scrolledToBottom: true,
      getTop: () => 999,
    });

    expect(active).toBe("faq");
  });

  it("returns last section whose top is above the offset", () => {
    const tops = new Map<string, number>([
      ["overview", 20],
      ["specs", 100],
      ["faq", 140],
    ]);

    const active = getActiveSectionId({
      presentIds: ["overview", "specs", "faq"],
      offset: SECTION_OFFSET,
      scrolledToBottom: false,
      getTop: (id) => tops.get(id) ?? null,
    });

    expect(active).toBe("specs");
  });

  it("returns null when no section has crossed the offset", () => {
    const active = getActiveSectionId({
      presentIds: ["overview", "specs"],
      offset: SECTION_OFFSET,
      scrolledToBottom: false,
      getTop: () => 300,
    });

    expect(active).toBeNull();
  });
});
