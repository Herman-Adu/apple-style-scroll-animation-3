import { existsSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { ASSET_GROUPS, videoPath } from "@/features/showcase/lib/domain/asset-paths"
import { packExportPlan } from "@/features/showcase/lib/domain/packs"
import { exportPlan } from "@/features/showcase/lib/domain/social-assets"
import { publishedVideo } from "../../../scripts/lib/showcase-paths.mjs"
import { CUTS, CUT_FORMATS, CALENDAR_CLIPS } from "../../../scripts/lib/showcase-cuts.mjs"

/**
 * Assets are grouped one folder per audience or topic, so picking what to post
 * means opening a folder rather than filtering by filename prefix. These keep
 * anything new to that shape — including anything a future sprint adds.
 */
const showcase = path.join(REPO_ROOT, "public", "showcase")
const filesUnder = (dir: string): string[] =>
  !existsSync(dir)
    ? []
    : readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
        entry.isDirectory()
          ? filesUnder(path.join(dir, entry.name))
          : [path.relative(showcase, path.join(dir, entry.name)).split(path.sep).join("/")],
      )

describe("published showcase assets", () => {
  const published = filesUnder(showcase)

  it("finds the published set", () => {
    expect(published.length).toBeGreaterThan(50)
  })

  it("files every social asset in a group folder, never loose in social/", () => {
    const loose = published.filter((file) => /^social\/[^/]+$/.test(file))
    expect(loose, "assets sitting directly in social/").toEqual([])
  })

  it("files every video in a group folder, never loose in video/", () => {
    const loose = published.filter((file) => /^video\/[^/]+$/.test(file))
    expect(loose, "videos sitting directly in video/").toEqual([])
  })

  it("only uses group folders it knows about", () => {
    const groups = new Set(published.filter((f) => f.startsWith("social/")).map((f) => f.split("/")[1]))
    for (const group of groups) expect(ASSET_GROUPS, `social/${group}`).toContain(group)
  })

  it("publishes every social asset exactly where the export plan says", () => {
    for (const item of [...exportPlan(), ...packExportPlan()]) {
      const file = path.join(REPO_ROOT, "public", item.file)
      expect(existsSync(file), `${item.asset} -> ${item.file}`).toBe(true)
    }
  })

  it("publishes every cut and calendar clip where the scripts write them", () => {
    for (const format of CUT_FORMATS) {
      for (const cut of CUTS) {
        const target = publishedVideo(cut.slug, format)
        for (const name of [target.video, target.poster]) {
          expect(existsSync(path.join(showcase, "video", name)), name).toBe(true)
        }
      }
      for (const clip of CALENDAR_CLIPS) {
        const target = publishedVideo(clip, format)
        for (const name of [target.video, target.poster]) {
          expect(existsSync(path.join(showcase, "video", name)), name).toBe(true)
        }
      }
    }
  })

  it("agrees with the public URL the app builds for the same video", () => {
    // The scripts write the file; the docs link to it. They must not drift.
    const target = publishedVideo("buyer", "9x16")
    expect(`/showcase/video/${target.video}`).toBe(videoPath("buyer", "9x16", "mp4"))
    expect(`/showcase/video/${target.poster}`).toBe(videoPath("buyer", "9x16", "jpg"))
  })
})
