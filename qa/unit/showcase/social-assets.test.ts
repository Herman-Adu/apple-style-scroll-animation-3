import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADUDEV } from "@/features/showcase/lib/domain/brand";
import {
  CAROUSEL_PDF,
  CASE_STUDY_LINK,
  LAYER_STEPS,
  SOCIAL_FORMATS,
  carouselSlides,
  caseStudyUrl,
  exportPlan,
  getSocialAsset,
  socialAssets,
} from "@/features/showcase/lib/domain/social-assets";
import { getInfographic, infographics } from "@/features/showcase/lib/domain/infographics";
import { docs } from "@/features/docs/content";
import { REPO_ROOT } from "@/qa/config/repo-root";
import { socialAssetPath } from "@/features/showcase/lib/domain/asset-paths";

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

describe("closing call to action", () => {
  const cta = carouselSlides().at(-1)!;

  it("offers both asks: read the case study, and get in touch", () => {
    expect(cta.cta?.link).toBe(CASE_STUDY_LINK);
    expect(cta.cta?.email).toBe(ADUDEV.email);
    expect(cta.cta?.ask.length).toBeGreaterThan(10);
  });

  it("points at a case study that exists", () => {
    const slug = CASE_STUDY_LINK.split("/docs/")[1];
    expect(docs.some((d) => d.slug === slug)).toBe(true);
  });

  it("builds the QR code from the https case study address", () => {
    expect(caseStudyUrl()).toBe(`https://${CASE_STUDY_LINK}`);
  });

  it("no longer relies on a bare link line to fill the slide", () => {
    expect(cta.points ?? []).toEqual([]);
  });
});

describe("diagram slides", () => {
  const flow = getSocialAsset("carousel-flow");
  const layers = getSocialAsset("carousel-layers");

  it("puts the checkout-to-email flow just before the permissions slide", () => {
    const ids = carouselSlides().map((s) => s.id);
    expect(ids.indexOf("carousel-flow")).toBeGreaterThan(-1);
    expect(ids.indexOf("carousel-flow")).toBe(ids.indexOf("carousel-layers") - 1);
  });

  it("draws permissions as a request passing three gates", () => {
    expect(layers?.diagram?.source.startsWith("flowchart")).toBe(true);
    for (const step of LAYER_STEPS) {
      expect(layers?.diagram?.source, step.name).toContain(step.name);
    }
    expect(layers?.diagram?.alt.length).toBeGreaterThan(20);
  });

  it("uses names the permissions doc also uses", () => {
    const text = JSON.stringify(docs.find((d) => d.slug === "authentication-and-access-control")!.body);
    for (const term of ["proxy.ts", "requireAdmin"]) {
      expect(text, term).toContain(term);
      expect(layers?.diagram?.source, term).toContain(term);
    }
  });

  it("draws checkout through to the delivered email", () => {
    expect(flow?.diagram?.source.startsWith("flowchart")).toBe(true);
    for (const term of ["Stripe", "Resend", "webhook"]) {
      expect(flow?.diagram?.source.toLowerCase(), term).toContain(term.toLowerCase());
    }
  });

  it("gives the square a compact graphic of its own, not a copy of the carousel", () => {
    const square = getSocialAsset("square-layers");
    expect(square?.visual).toBe("layers");
    expect(square?.points ?? []).toEqual([]);
    expect(square?.diagram).toBeUndefined();
  });
});

describe("export plan", () => {
  it("writes one PNG per asset at its format size, plus the carousel PDF", () => {
    const plan = exportPlan();
    const pngs = plan.filter((p) => p.kind === "png");
    expect(pngs).toHaveLength(socialAssets.length + infographics.length);
    for (const p of pngs) {
      const asset = getSocialAsset(p.asset) ?? getInfographic(p.asset)!;
      expect(p.file).toBe(socialAssetPath(asset.id));
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
