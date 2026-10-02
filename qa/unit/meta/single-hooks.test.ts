import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const root = process.cwd()

describe("shared hooks have one copy", () => {
  it.each(["use-toast", "use-mobile"])("%s lives only in hooks/", (name) => {
    expect(existsSync(join(root, "hooks", `${name}.ts`))).toBe(true)
    expect(existsSync(join(root, "components/ui", `${name}.ts`))).toBe(false)
    expect(existsSync(join(root, "components/ui", `${name}.tsx`))).toBe(false)
  })
})
