import { z } from "zod"

const count = z.number().int().nonnegative()
const percent = z.number().min(0).max(100)

/**
 * Shape of the measured numbers written by `pnpm facts` (scripts/lib/facts.mjs):
 * the git-ignored .generated/facts.json the render pipeline reads, and the
 * committed snapshot.json beside this file that live pages read after a deploy.
 *
 * This lives in lib/ because both the showcase slice and the docs slice read
 * it, and shared code may never import a feature.
 */
export const factsSchema = z.object({
  generatedAt: z.string(),
  tests: z.object({ unit: count, integration: count, smoke: count, axe: count, seo: count, total: count }),
  coverage: z.object({ lines: percent, branches: percent }),
  arch: z.object({ deepImports: count, libToFeatures: count, anyTypes: count, largeFiles: count, useEffect: count }),
  docs: z.object({ pages: count }),
  routes: z.object({ pages: count }),
  /** Counted from merged history, so a post cannot claim more review than happened. */
  repo: z.object({ mergedPrs: count, latestPr: count }),
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
  "repo.mergedPrs",
  "repo.latestPr",
] as const

export type FactKey = (typeof FACT_KEYS)[number]
export type FactRef = { fact: FactKey }

export function resolveFact(facts: Facts | null, key: FactKey): number | null {
  if (!facts) return null
  const [group, name] = key.split(".") as [keyof Facts, string]
  const value: unknown = (facts[group] as Record<string, unknown>)[name]
  return typeof value === "number" ? value : null
}
