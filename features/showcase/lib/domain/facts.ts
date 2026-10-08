import { FACT_KEYS, type FactKey } from "@/lib/facts/schema"

export * from "@/lib/facts/schema"

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
    const inside =
      illustrative ||
      ("illustrative" in value && value.illustrative === true) ||
      ("demoData" in value && value.demoData === true)
    return Object.entries(value).flatMap(([k, v]) => findHardCodedNumbers(v, join(path, k), inside))
  }
  return []
}

const join = (path: string, part: string | number) => (path ? `${path}.${part}` : String(part))
