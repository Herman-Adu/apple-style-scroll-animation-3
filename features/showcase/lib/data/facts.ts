import "server-only"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { factsSchema, type Facts } from "../domain/facts"

/** Reads .generated/facts.json. Returns null when `pnpm facts` has not run (for example on a deploy). */
export async function loadFacts(): Promise<Facts | null> {
  try {
    const raw = await readFile(join(/* turbopackIgnore: true */ process.cwd(), ".generated", "facts.json"), "utf8")
    const parsed = factsSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
