import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADUDEV, contrastRatio } from "@/features/showcase/lib/domain/brand";
import { siteConfig } from "@/lib/data/site";
import { REPO_ROOT } from "@/qa/config/repo-root";

describe("AduDev brand", () => {
  it("uses the palette from the brand guidelines", () => {
    expect(ADUDEV.colors).toMatchObject({
      base: "#0F0F0F",
      surface: "#1A1A1A",
      border: "#2D2D2D",
      orange: "#F47C00",
      text: "#FFFFFF",
    });
  });

  it("is signed with the contact address the site already uses", () => {
    expect(ADUDEV.name).toBe("AduDev");
    expect(ADUDEV.email).toBe(siteConfig.email);
  });

  it("ships every logo variant as a committed file", () => {
    for (const src of Object.values(ADUDEV.logos)) {
      expect(existsSync(join(REPO_ROOT, "public", src)), src).toBe(true);
    }
  });

  it("keeps text readable on every surface it is used on", () => {
    const { colors } = ADUDEV;
    expect(contrastRatio(colors.text, colors.base)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.muted, colors.base)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(colors.orange, colors.base)).toBeGreaterThanOrEqual(4.5);
    // White on the brand orange is only ~2.7:1, so buttons use dark text.
    expect(contrastRatio(colors.onOrange, colors.orange)).toBeGreaterThanOrEqual(4.5);
  });
});

describe("contrastRatio", () => {
  it("matches the WCAG reference values", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});
