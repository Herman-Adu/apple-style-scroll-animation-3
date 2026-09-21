import { createRequire } from "node:module"
import fs from "node:fs"

const require = createRequire(import.meta.url)
const sharp = require(`${process.cwd()}/node_modules/.pnpm/sharp@0.34.5/node_modules/sharp`)

const dir = "public/products/beat-exploded"
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png"))

const lo = 18 // fully transparent at/below this luminance
const hi = 60 // fully opaque at/above this luminance

for (const f of files) {
  const p = `${dir}/${f}`
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info
  for (let i = 0; i < data.length; i += channels) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    let a
    if (lum <= lo) a = 0
    else if (lum >= hi) a = 255
    else a = Math.round(((lum - lo) / (hi - lo)) * 255)
    data[i + 3] = Math.min(data[i + 3], a)
  }
  await sharp(data, { raw: { width, height, channels } }).png().toFile(`${p}.tmp`)
  fs.renameSync(`${p}.tmp`, p)
  console.log("keyed", f)
}
console.log("done")
