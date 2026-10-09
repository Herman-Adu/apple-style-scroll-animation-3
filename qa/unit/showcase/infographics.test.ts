import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
  INFOGRAPHIC_KINDS,
  getInfographic,
  infographics,
  type Infographic,
} from "@/features/showcase/lib/domain/infographics"
import { SOCIAL_FORMATS, exportPlan, socialAssets } from "@/features/showcase/lib/domain/social-assets"
import { REPO_ROOT } from "@/qa/config/repo-root"
import { measure } from "@/scripts/lib/arch-audit-metrics.mjs"
import { collectSources } from "@/scripts/lib/source-files.mjs"
import { socialAssetPath } from "@/features/showcase/lib/domain/asset-paths"

const read = (file: string) => readFileSync(join(REPO_ROOT, file), "utf8")
const pkg = JSON.parse(read("package.json")) as {
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}
const installed = { ...pkg.dependencies, ...pkg.devDependencies }

const NON_COPY_KEYS = new Set(["id", "kind", "format", "source", "path", "version", "before", "after", "alt"])

function visibleCopy(value: unknown, key = ""): string[] {
  if (NON_COPY_KEYS.has(key)) return []
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap((v) => visibleCopy(v))
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => visibleCopy(v, k))
  }
  return []
}

function ofKind<K extends Infographic["kind"]>(kind: K) {
  return infographics.filter((i): i is Extract<Infographic, { kind: K }> => i.kind === kind)
}

describe("infographic catalogue", () => {
  it("has unique, url-safe ids that never collide with slides", () => {
    const ids = infographics.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    const slideIds = new Set(socialAssets.map((a) => a.id))
    for (const id of ids) {
      expect(id).toMatch(/^infographic(-[a-z0-9]+)+$/)
      expect(slideIds.has(id), id).toBe(false)
    }
  })

  it("renders each structure area exactly once, in tour order", () => {
    // Without this, giving two slides the same area shows one tree twice and
    // drops another, under a title that still promises the missing one.
    expect(ofKind("structure").map((i) => i.area)).toEqual(["overview", "storefront", "admin", "docs"])
  })

  it("covers every planned kind exactly once in the core catalogue (audience packs reuse kinds)", () => {
    expect([...INFOGRAPHIC_KINDS].sort()).toEqual(
      [
        "before-after",
        "flow",
        "gates",
        "layers",
        "offer",
        "structure",
        "stack",
        "table",
        "bar-chart",
        "line-chart",
        "sequence",
      ].sort(),
    )
    for (const kind of INFOGRAPHIC_KINDS) {
      // "structure" is the one kind with a slide per area rather than one
      // slide: the site tour opens on an overview and a page per front door.
      const expected = kind === "structure" ? 4 : 1
      expect(ofKind(kind).filter((i) => !i.pack), kind).toHaveLength(expected)
    }
  })

  it("uses a supported social format", () => {
    for (const i of infographics) expect(Object.keys(SOCIAL_FORMATS), i.id).toContain(i.format)
  })

  it("looks up by id", () => {
    expect(getInfographic("infographic-stack")?.kind).toBe("stack")
    expect(getInfographic("nope")).toBeUndefined()
  })

  it("keeps copy short enough to read at feed size", () => {
    for (const i of infographics) {
      expect(i.title.length, `${i.id} title`).toBeLessThanOrEqual(60)
      expect(i.summary.length, `${i.id} summary`).toBeLessThanOrEqual(160)
      for (const text of visibleCopy(i)) {
        expect(text.length, `${i.id}: ${text}`).toBeLessThanOrEqual(70)
        expect(text.trim(), i.id).toBe(text)
        expect(text.length, i.id).toBeGreaterThan(0)
      }
    }
  })

  it("never shows emails, keys or prices", () => {
    for (const i of infographics) {
      for (const text of visibleCopy(i)) {
        expect(text, `${i.id}: ${text}`).not.toMatch(/@|sk_|pk_|whsec_|re_[A-Za-z0-9]{8,}|[£$€]\s?\d/)
      }
    }
  })
})

describe("stack infographic", () => {
  const [stack] = ofKind("stack")
  const items = stack.groups.flatMap((g) => g.items)

  it("names real technology the repo actually uses", () => {
    expect(items.length).toBeGreaterThanOrEqual(8)
    for (const item of items) {
      if ("pkg" in item.source) {
        const range = installed[item.source.pkg]
        expect(range, `${item.name} needs ${item.source.pkg} in package.json`).toBeDefined()
        if (item.source.major !== undefined) {
          const major = Number(range.replace(/^[^\d]*/, "").split(".")[0])
          expect(major, `${item.name} major`).toBe(item.source.major)
          expect(item.version, item.name).toBe(String(item.source.major))
        }
      } else {
        expect(existsSync(join(REPO_ROOT, item.source.file)), item.source.file).toBe(true)
      }
    }
  })

  it("includes the headline stack a CTO expects", () => {
    const names = items.map((i) => i.name)
    for (const expected of ["Next.js", "React", "TypeScript", "Prisma", "Neon", "Better Auth", "Stripe", "Resend", "Vitest", "Playwright"]) {
      expect(names, expected).toContain(expected)
    }
  })
})

describe("before and after infographic", () => {
  const [beforeAfter] = ofKind("before-after").filter((i) => !i.pack)
  const health = read("docs/architecture-health.md")
  const pack = read("features/docs/content/social-launch-pack.ts")

  it("starts from the documented baseline", () => {
    expect(beforeAfter.rows.length).toBe(4)
    for (const row of beforeAfter.rows) expect(health, row.label).toMatch(new RegExp(`\\|\\s*${row.before}\\s*\\|`))
  })

  it("states the same baseline as the launch pack", () => {
    for (const row of beforeAfter.rows) expect(pack, row.label).toContain(`from ${row.before}`)
  })

  it("reads each after value from an architecture fact the live code still beats", () => {
    const now: Record<string, number> = measure(collectSources(REPO_ROOT))
    for (const row of beforeAfter.rows) {
      expect(row.after.fact, row.label).toMatch(/^arch\./)
      expect(now[row.after.fact.replace(/^arch\./, "")], row.label).toBeLessThan(row.before)
    }
  })
})

describe("flow and quality gate infographics", () => {
  it("shows the checkout and email flow from cart to confirmation", () => {
    const [flow] = ofKind("flow")
    expect(flow.steps.length).toBeGreaterThanOrEqual(5)
    expect(flow.steps.length).toBeLessThanOrEqual(7)
    expect(flow.steps[0].title.toLowerCase()).toContain("cart")
    expect(flow.steps.at(-1)?.title.toLowerCase()).toContain("email")
  })

  it("lists the gates the repo really runs", () => {
    const [gates] = ofKind("gates")
    const scripts = JSON.parse(read("package.json")).scripts as Record<string, string>
    const names = gates.steps.map((s) => s.name.toLowerCase())
    for (const expected of ["typecheck", "lint", "arch", "unit", "integration", "smoke", "axe"]) {
      expect(names, expected).toContain(expected)
    }
    for (const script of ["lint", "arch", "test:unit", "test:integration", "test:smoke", "test:axe"]) {
      expect(scripts[script], script).toBeDefined()
    }
  })
})

describe("client offer infographic", () => {
  it("separates what is included, what is customised and the handover", () => {
    const [offer] = ofKind("offer")
    expect(offer.columns.map((c) => c.heading)).toEqual(["Included", "Customised for you", "Handover"])
    for (const column of offer.columns) expect(column.items.length, column.heading).toBeGreaterThanOrEqual(3)
  })
})

describe("export plan", () => {
  it("renders every infographic as a PNG at its native size", () => {
    const plan = exportPlan()
    for (const i of infographics) {
      const item = plan.find((p) => p.asset === i.id)
      expect(item, i.id).toBeDefined()
      expect(item).toMatchObject({ kind: "png", file: socialAssetPath(i.id), ...SOCIAL_FORMATS[i.format] })
    }
  })

  it("keeps the existing slide exports", () => {
    const plan = exportPlan()
    for (const a of socialAssets) expect(plan.some((p) => p.asset === a.id), a.id).toBe(true)
    expect(plan.some((p) => p.kind === "pdf")).toBe(true)
  })
})
