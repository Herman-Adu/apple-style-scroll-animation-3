import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  CAROUSEL_PDF,
  SOCIAL_FORMATS,
  carouselSlides,
  exportPlan,
  getSocialAsset,
  socialAssets,
} from "@/features/showcase/lib/domain/social-assets";
import { docs } from "@/features/docs/content";
import { REPO_ROOT } from "@/qa/config/repo-root";

const publicFile = (src: string) =>
  existsSync(join(REPO_ROOT, "public", src.replace(/^[/\\\\]/, "")));

describe("social asset catalogue", () => {
  it("uses the native LinkedIn portrait and square sizes", () => {
    expect(SOCIAL_FORMATS.carousel).toEqual({ width: 1080, height: 1350 });
    expect(SOCIAL_FORMATS.square).toEqual({ width: 1080, height: 1080 });
  });

  it("has unique, url-safe ids", () => {
    const ids = socialAssets.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(ids).not.toContain("carousel");
  });

  it("orders the carousel from cover to call to action", () => {
    const slides = carouselSlides();
    expect(slides.length).toBeGreaterThanOrEqual(5);
    expect(slides.length).toBeLessThanOrEqual(10);
    expect(slides.every((s) => s.format === "carousel")).toBe(true);
    expect(slides[0].role).toBe("cover");
    expect(slides.at(-1)?.role).toBe("cta");
  });

  it("keeps copy short enough to read on a phone", () => {
    for (const a of socialAssets) {
      expect(a.title.length, a.id).toBeLessThanOrEqual(60);
      expect(a.body.length, a.id).toBeLessThanOrEqual(180);
    }
  });

  it("only references images that exist, each with alt text", () => {
    for (const a of socialAssets) {
      if (!a.image) continue;
      expect(publicFile(a.image.src), a.image.src).toBe(true);
      expect(a.image.alt.length, a.id).toBeGreaterThan(10);
    }
  });

  it("looks assets up by id", () => {
    expect(getSocialAsset(socialAssets[0].id)).toBe(socialAssets[0]);
    expect(getSocialAsset("nope")).toBeUndefined();
  });
});

describe("export plan", () => {
  it("writes one PNG per asset at its format size, plus the carousel PDF", () => {
    const plan = exportPlan();
    const pngs = plan.filter((p) => p.kind === "png");
    expect(pngs).toHaveLength(socialAssets.length);
    for (const p of pngs) {
      const asset = getSocialAsset(p.asset)!;
      expect(p.file).toBe(`/showcase/social/${asset.id}.png`);
      expect({ width: p.width, height: p.height }).toEqual(
        SOCIAL_FORMATS[asset.format],
      );
    }
    expect(plan.filter((p) => p.kind === "pdf")).toEqual([
      {
        kind: "pdf",
        asset: "carousel",
        file: CAROUSEL_PDF,
        ...SOCIAL_FORMATS.carousel,
      },
    ]);
  });
});

describe("social launch kit", () => {
  const kit = docs.find((d) => d.slug === "social-launch-kit")!;
  const text = JSON.stringify(kit.body);

  it("links every exported file, and every file is committed", () => {
    for (const p of exportPlan()) {
      expect(text, p.file).toContain(p.file);
      expect(publicFile(p.file), p.file).toBe(true);
    }
  });

  it.each(["LinkedIn", "Facebook", "Telegram", "X"])(
    "names the files to post on %s",
    (channel) => {
      const table = kit.body.find(
        (b) => b.type === "table" && b.title === "Download kit per channel",
      );
      expect(
        table &&
          table.type === "table" &&
          table.rows.some((r) => r[0] === channel),
      ).toBe(true);
    },
  );
});
