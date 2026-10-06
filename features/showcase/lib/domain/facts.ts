import { z } from "zod"

const count = z.number().int().nonnegative()
const percent = z.number().min(0).max(100)

/** Shape of .generated/facts.json, written by `pnpm facts` (scripts/lib/facts.mjs). */
export const factsSchema = z.object({
  generatedAt: z.string(),
  tests: z.object({ unit: count, integration: count, smoke: count, axe: count, seo: count, total: count }),
  coverage: z.object({ lines: percent, branches: percent }),
  arch: z.object({ deepImports: count, libToFeatures: count, anyTypes: count, largeFiles: count, useEffect: count }),
  docs: z.object({ pages: count }),
  routes: z.object({ pages: count }),
})

export type Facts = z.infer<typeof factsSchema>

export const FACT_KEYS = [
  "tests.unit",
  "tests.integration",
  "tests.smoke",
  "tests.axe",
  "tests.seo",
  "tests.total",
  "coverage.lines",
  "coverage.branches",
  "arch.deepImports",
  "arch.libToFeatures",
  "arch.anyTypes",
  "arch.largeFiles",
  "arch.useEffect",
  "docs.pages",
  "routes.pages",
] as const

export type FactKey = (typeof FACT_KEYS)[number]
export type FactRef = { fact: FactKey }

export function resolveFact(facts: Facts | null, key: FactKey): number | null {
  if (!facts) return null
  const [group, name] = key.split(".") as [keyof Facts, string]
  const value: unknown = (facts[group] as Record<string, unknown>)[name]
  return typeof value === "number" ? value : null
}

/** String fields whose digits come from a checked source (package.json versions, real route paths). */
const SOURCED_STRING_KEYS = new Set(["version", "path", "pkg", "file"])
/** Numeric fields with a checked source: the documented baseline and package majors. */
const SOURCED_NUMBER_KEYS = new Set(["before", "major"])
const isFactKey = (value: unknown): value is FactKey => (FACT_KEYS as readonly unknown[]).includes(value)

/**
 * Paths of every number on a slide that is typed in rather than read from facts.
 * Inside an object marked `illustrative: true`, raw numeric values are allowed
 * (the slide prints "Illustrative"), but digits in copy are still refused.
 */
export function findHardCodedNumbers(value: unknown, path = "", illustrative = false): string[] {
  const key = path.split(".").at(-1) ?? ""
  if (typeof value === "string") return /\d/.test(value) && !SOURCED_STRING_KEYS.has(key) ? [path] : []
  if (typeof value === "number") return illustrative || SOURCED_NUMBER_KEYS.has(key) ? [] : [path]
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => findHardCodedNumbers(item, join(path, index), illustrative))
  }
  if (value && typeof value === "object") {
    if ("fact" in value) return isFactKey(value.fact) ? [] : [join(path, "fact")]
    const inside = illustrative || ("illustrative" in value && value.illustrative === true)
    return Object.entries(value).flatMap(([k, v]) => findHardCodedNumbers(v, join(path, k), inside))
  }
  return []
}

const join = (path: string, part: string | number) => (path ? `${path}.${part}` : String(part))
