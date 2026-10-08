// @ts-check
/**
 * Records every showcase clip in the 4:5 and 9:16 formats, then stitches the
 * recruiter, buyer and engineer cuts and publishes the calendar clips on their own,
 * each as an .mp4 plus a .jpg poster in public/showcase/video/.
 *
 *   pnpm showcase:cuts              record both formats, then build
 *   pnpm showcase:cuts --no-record  build from the raw clips already recorded
 *   add --calendar-only             publish the calendar clips and skip the cuts
 *   add --clip <slug>               publish just that one calendar clip
 */
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs"
import path from "node:path"
import ffmpegPath from "ffmpeg-static"
import {
  CUTS,
  CUT_FORMATS,
  buildConcatArgs,
  buildConcatList,
  cutOutputName,
  missingRawClips,
  selectCalendarClips,
} from "./lib/showcase-cuts.mjs"
import { slugForFormat } from "./lib/showcase-formats.mjs"
import { buildPosterArgs, buildTranscodeArgs } from "./lib/video-args.mjs"
import { publishedVideo } from "./lib/showcase-paths.mjs"

const root = process.cwd()
const rawDir = path.join(root, "test-results", "showcase", "raw")
const listDir = path.join(root, "test-results", "showcase", "lists")
const outDir = path.join(root, "public", "showcase", "video")

const ffmpeg = /** @type {string | null} */ (/** @type {unknown} */ (ffmpegPath))
if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error("ffmpeg-static binary missing. Run `pnpm rebuild ffmpeg-static`.")
  process.exit(1)
}

if (!process.argv.includes("--no-record")) {
  for (const format of CUT_FORMATS) {
    execFileSync("pnpm", ["exec", "playwright", "test", "--config", "qa/config/playwright.showcase.config.mts"], {
      stdio: "inherit",
      env: { ...process.env, SHOWCASE_FORMAT: format },
    })
  }
}

const available = existsSync(rawDir)
  ? readdirSync(rawDir).filter((file) => file.endsWith(".webm")).map((file) => file.replace(/\.webm$/, ""))
  : []

const cuts = process.argv.includes("--calendar-only") ? [] : CUTS
const calendarClips = selectCalendarClips(process.argv)

const missing = CUT_FORMATS.flatMap((format) => [
  ...cuts.flatMap((cut) => missingRawClips(cut.clips, format, available)),
  ...missingRawClips(calendarClips, format, available),
])
if (missing.length > 0) {
  console.error(`Missing raw clips: ${[...new Set(missing)].join(", ")}. Seed, then record again.`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })
mkdirSync(listDir, { recursive: true })

/** @param {string} input @param {{ dir: string, poster: string }} target */
function writePoster(input, target) {
  mkdirSync(path.join(outDir, target.dir), { recursive: true })
  execFileSync(ffmpeg, buildPosterArgs({ input, output: path.join(outDir, target.poster), atSeconds: 3 }), {
    stdio: "ignore",
  })
}

for (const format of CUT_FORMATS) {
  for (const cut of cuts) {
    const name = cutOutputName(cut.slug, format)
    const target = publishedVideo(cut.slug, format)
    const listFile = path.join(listDir, `${name}.txt`)
    const inputs = cut.clips.map((clip) => path.join(rawDir, `${slugForFormat(clip, format)}.webm`))
    writeFileSync(listFile, buildConcatList(inputs))
    mkdirSync(path.join(outDir, target.dir), { recursive: true })
    const output = path.join(outDir, target.video)
    execFileSync(ffmpeg, buildConcatArgs({ listFile, output }), { stdio: "ignore" })
    writePoster(output, target)
    console.log(`✓ ${target.video} (${cut.clips.join(" + ")})`)
  }

  for (const clip of calendarClips) {
    const name = slugForFormat(clip, format)
    const target = publishedVideo(clip, format)
    const input = path.join(rawDir, `${name}.webm`)
    mkdirSync(path.join(outDir, target.dir), { recursive: true })
    execFileSync(ffmpeg, buildTranscodeArgs({ input, output: path.join(outDir, target.video) }), {
      stdio: "ignore",
    })
    writePoster(input, target)
    console.log(`✓ ${target.video}`)
  }
}
