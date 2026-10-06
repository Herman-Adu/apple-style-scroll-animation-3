// @ts-check
/**
 * Records the showcase clips with Playwright, then converts each raw .webm to
 * an H.264 .mp4 plus a .jpg poster in public/showcase/video/.
 *
 *   pnpm showcase:video              record + convert
 *   pnpm showcase:video --no-record  convert existing raw clips only
 */
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync } from "node:fs"
import path from "node:path"
import ffmpegPath from "ffmpeg-static"
import { formatFromEnv } from "./lib/showcase-formats.mjs"
import { buildPosterArgs, buildTranscodeArgs, clipFileNames } from "./lib/video-args.mjs"

const root = process.cwd()
const rawDir = path.join(root, "test-results", "showcase", "raw")
const outDir = path.join(root, "public", "showcase", "video")

const formatFlag = process.argv.find((arg) => arg.startsWith("--format="))?.slice("--format=".length)
const format = formatFromEnv(formatFlag ?? process.env.SHOWCASE_FORMAT)

if (!process.argv.includes("--no-record")) {
  execFileSync("pnpm", ["exec", "playwright", "test", "--config", "qa/config/playwright.showcase.config.mts"], {
    stdio: "inherit",
    env: { ...process.env, SHOWCASE_FORMAT: format },
  })
}

const ffmpeg = /** @type {string | null} */ (/** @type {unknown} */ (ffmpegPath))
if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error("ffmpeg-static binary missing. Run `pnpm rebuild ffmpeg-static`.")
  process.exit(1)
}

if (!existsSync(rawDir)) {
  console.error(`No raw clips in ${path.relative(root, rawDir)}. Record first.`)
  process.exit(1)
}

mkdirSync(outDir, { recursive: true })

const clips = readdirSync(rawDir).filter((file) => file.endsWith(".webm"))
for (const file of clips) {
  const slug = file.replace(/\.webm$/, "")
  const names = clipFileNames(slug)
  const input = path.join(rawDir, file)
  execFileSync(ffmpeg, buildTranscodeArgs({ input, output: path.join(outDir, names.video) }), { stdio: "ignore" })
  execFileSync(ffmpeg, buildPosterArgs({ input, output: path.join(outDir, names.poster), atSeconds: 8 }), {
    stdio: "ignore",
  })
  console.log(`✓ ${names.video} + ${names.poster}`)
}

console.log(`${clips.length} clip(s) written to ${path.relative(root, outDir)}`)
