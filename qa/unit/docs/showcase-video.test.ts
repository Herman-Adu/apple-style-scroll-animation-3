import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import type { DocBlock } from "@/features/docs/lib/schema";

type VideoBlock = Extract<DocBlock, { type: "video" }>;

const videosIn = (slug: string): VideoBlock[] =>
  (docs.find((d) => d.slug === slug)?.body ?? []).filter(
    (b): b is VideoBlock => b.type === "video",
  );

const publicFile = (src: string) => {
  let repoRoot = __dirname;
  while (
    !existsSync(join(repoRoot, "package.json")) &&
    repoRoot !== join(repoRoot, "..")
  ) {
    repoRoot = join(repoRoot, "..");
  }
  return existsSync(join(repoRoot, "public", src.replace(/^[/\\\\]/, "")));
};

describe("showcase video embeds", () => {
  it.each(["case-study-email-platform", "social-launch-kit"])(
    "%s embeds the storefront clip",
    (slug) => {
      const videos = videosIn(slug);
      expect(videos.map((v) => v.src)).toContain(
        "/showcase/video/storefront.mp4",
      );
    },
  );

  it("every video block points at a committed clip and poster with a text alternative", () => {
    const all = docs.flatMap((d) =>
      d.body.filter((b): b is VideoBlock => b.type === "video"),
    );
    expect(all.length).toBeGreaterThan(0);
    for (const v of all) {
      expect(publicFile(v.src), v.src).toBe(true);
      expect(publicFile(v.poster), v.poster).toBe(true);
      expect(v.description.length).toBeGreaterThan(20);
    }
  });
});
