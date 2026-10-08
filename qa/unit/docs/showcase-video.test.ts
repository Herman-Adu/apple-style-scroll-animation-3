import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { docs } from "@/features/docs/content";
import type { DocBlock } from "@/features/docs/lib/domain/schema";
import { REPO_ROOT } from "@/qa/config/repo-root";
import { videoPath } from "@/features/showcase/lib/domain/asset-paths";

type VideoBlock = Extract<DocBlock, { type: "video" }>;

const videosIn = (slug: string): VideoBlock[] =>
  (docs.find((d) => d.slug === slug)?.body ?? []).filter(
    (b): b is VideoBlock => b.type === "video",
  );

const publicFile = (src: string) =>
  existsSync(join(REPO_ROOT, "public", src.replace(/^[/\\\\]/, "")));

describe("showcase video embeds", () => {
  it.each(["case-study-email-platform", "social-launch-kit"])(
    "%s embeds the storefront clip",
    (slug) => {
      const videos = videosIn(slug);
      expect(videos.map((v) => v.src)).toContain(
        "/showcase/video/storefront/landscape.mp4",
      );
    },
  );

  it("the launch kit embeds the journey calendar clip in both formats", () => {
    const srcs = videosIn("social-launch-kit").map((v) => v.src);
    expect(srcs).toContain("/showcase/video/journey/4x5.mp4");
    expect(srcs).toContain("/showcase/video/journey/9x16.mp4");
  });

  it.each(["recruiter", "buyer", "engineer"])("the launch kit embeds the %s cut in both formats", (cut) => {
    const srcs = videosIn("social-launch-kit").map((v) => v.src);
    expect(srcs).toContain(videoPath(cut, "4x5", "mp4"));
    expect(srcs).toContain(videoPath(cut, "9x16", "mp4"));
  });

  it("the launch kit embeds the restock calendar clip in both formats", () => {
    const srcs = videosIn("social-launch-kit").map((v) => v.src);
    expect(srcs).toContain("/showcase/video/restock/4x5.mp4");
    expect(srcs).toContain("/showcase/video/restock/9x16.mp4");
  });

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
