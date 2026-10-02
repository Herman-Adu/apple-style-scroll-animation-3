import { existsSync, readdirSync, readFileSync, statSync } from "node:fs"
import { dirname, join, relative } from "node:path"
import { describe, expect, it } from "vitest"

const ROOT = join(__dirname, "../../..")
const STRIPE_SERVER = "lib/stripe/server.ts"
const ACTIONS_ENTRY = /^@\/features\/[^/]+\/actions$/
const IMPORT_RE = /(?:import|export)\s[^'"]*?from\s+["']([^"']+)["']|import\s+["']([^"']+)["']/g

function resolveSpecifier(fromFile: string, spec: string): string | null {
  const base = spec.startsWith("@/")
    ? join(ROOT, spec.slice(2))
    : spec.startsWith(".")
      ? join(dirname(fromFile), spec)
      : null
  if (!base) return null
  const candidates = [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")]
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null
}

function reachableFrom(entry: string): Set<string> {
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length > 0) {
    const file = queue.shift()!
    if (seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, "utf8")
    for (const match of source.matchAll(IMPORT_RE)) {
      const line = source.slice(source.lastIndexOf("\n", match.index) + 1, match.index + match[0].length)
      if (/^\s*(import|export)\s+type\b/.test(line)) continue
      const spec = match[1] ?? match[2]
      if (ACTIONS_ENTRY.test(spec)) continue
      const next = resolveSpecifier(file, spec)
      if (next) queue.push(next)
    }
  }
  return new Set([...seen].map((f) => relative(ROOT, f)))
}

const sliceEntries = readdirSync(join(ROOT, "features"), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(join(ROOT, "features", d.name, "index.ts")))
  .map((d) => `features/${d.name}/index.ts`)

describe("slice index entries stay client-safe", () => {
  it.each(sliceEntries)("%s never loads the Stripe server client", (entry) => {
    expect(reachableFrom(join(ROOT, entry)).has(STRIPE_SERVER)).toBe(false)
  })
})
