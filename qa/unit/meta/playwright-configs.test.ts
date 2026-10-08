import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"
import { REPO_ROOT } from "@/qa/config/repo-root"

const configDir = path.join(REPO_ROOT, "qa", "config")
const configs = readdirSync(configDir).filter((file) => file.startsWith("playwright") && file.endsWith(".mts"))

describe("playwright configs", () => {
  it("finds every playwright config", () => {
    expect(configs.length).toBeGreaterThanOrEqual(3)
  })

  it.each(configs)("%s writes its artifacts to its own folder", (file) => {
    // Playwright empties outputDir before each run and defaults it to the whole
    // of test-results, where the showcase recordings live. A config without its
    // own folder deletes the raw clips of every other one.
    const source = readFileSync(path.join(configDir, file), "utf8")
    expect(source, `${file} sets outputDir`).toMatch(/outputDir:/)
    expect(source, `${file} does not claim the whole of test-results`).not.toMatch(
      /outputDir:\s*path\.join\(projectRoot,\s*"test-results"\s*\)/,
    )
  })
})
