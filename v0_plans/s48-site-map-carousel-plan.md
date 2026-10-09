# Site Map Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken, hand-written `site-map` slide with four structure slides derived from the app's real navigation, inside the existing `site-tour` carousel.

**Architecture:** A new domain module maps three live nav sources (`mainNav`, `adminNav`, the docs taxonomy) into one plain tree. A new `structure` slide kind renders one area per slide, so no slide can overflow. Two guards keep it honest: a coverage test that fails when a nav item reaches no slide, and a smoke test that fails when any slide's content exceeds its page.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest (`qa/unit`), Playwright (`qa/smoke`), Tailwind v4 tokens.

**Spec:** `v0_plans/s48-site-map-carousel.md`

## Global Constraints

- Never commit to `main`. One sprint = one branch = one PR = squash-merge. Branch is `v0/s48-site-map-carousel`, already rebased onto `main` at `3e3c904`.
- Test first: write the failing test, see it fail for the right reason, then implement.
- `deepImports` is ratcheted at **0**: import `@/features/admin` and `@/features/docs` (slice indexes) only, never `@/features/<slice>/lib/...`.
- `largeFiles` is ratcheted at **21**: no source file over 300 lines.
- Slide components may not name `accent-teal` or hard-code a hex (`qa/unit/showcase/slide-palette.test.ts`); accents come from `--primary`.
- No measured number typed into slide copy — bind to facts (`routes.pages`, `docs.pages`). `findHardCodedNumbers` enforces this.
- Run `pnpm` scripts, never bare `vitest`/`playwright`.

## Review Focus

- **A nav item with no children** (`Products` has sections; `Orders` has none) — the group must render as a leaf, not an empty container with a dangling rule.
- **A docs audience with zero visible categories** — `docsGroups()` must not emit an empty group that renders as a blank card.
- **A nav href with a query or hash** (`/products?category=Headphones`, `/about#values`) — the route-existence check must not treat these as missing files.
- **The longest admin group** (Email, 5 children) sets slide height — the admin slide must still pass the overflow guard with the real data, not just a trimmed sample.

---

### Task 1: Derive the site structure

**Files:**
- Create: `features/showcase/lib/domain/site-structure.ts`
- Test: `qa/unit/showcase/site-structure.test.ts`

**Interfaces:**
- Consumes: `mainNav` from `@/components/layout/main-nav`; `adminNav` from `@/features/admin`; `DOC_AUDIENCES`, `DOC_CATEGORY_AUDIENCE`, `docAudienceMeta` from `@/features/docs`.
- Produces: `siteStructure(): StructureArea[]`, `getArea(id: AreaId): StructureArea`, and the types `AreaId`, `StructureNode`, `StructureGroup`, `StructureArea`.

- [ ] **Step 1: Write the failing test**

Create `qa/unit/showcase/site-structure.test.ts`:

```ts
import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { mainNav } from "@/components/layout/main-nav"
import { adminNav } from "@/features/admin"
import { DOC_AUDIENCES, docAudienceMeta } from "@/features/docs"
import { getArea, siteStructure } from "@/features/showcase/lib/domain/site-structure"
import { REPO_ROOT } from "@/qa/config/repo-root"

/**
 * The slide is derived, not written down, because the hand-written one drifted:
 * it omitted About and Contact (both top-level nav) while listing Checkout and
 * Account (neither). These fail the moment a nav item reaches no slide.
 */
const labelsIn = (id: Parameters<typeof getArea>[0]) =>
  getArea(id).groups.flatMap((group) => [group.label, ...group.children.map((child) => child.label)])

describe("site structure", () => {
  it("covers every top-level storefront nav item", () => {
    const labels = labelsIn("storefront")
    expect(mainNav.map((item) => item.label).filter((label) => !labels.includes(label))).toEqual([])
  })

  it("covers every top-level admin nav item", () => {
    const labels = labelsIn("admin")
    expect(adminNav.map((item) => item.label).filter((label) => !labels.includes(label))).toEqual([])
  })

  it("covers every docs audience", () => {
    const labels = labelsIn("docs")
    const expected = DOC_AUDIENCES.map((audience) => docAudienceMeta[audience].label)
    expect(expected.filter((label) => !labels.includes(label))).toEqual([])
  })

  it("never emits an empty group", () => {
    const empty = siteStructure().flatMap((area) =>
      area.groups.filter((group) => group.label.trim() === "").map((group) => `${area.id} ${group.label}`),
    )
    expect(empty).toEqual([])
  })

  it("names a real route file for every path it prints", () => {
    // Query and hash are navigation detail, not separate files.
    const pageExists = (route: string) => {
      const clean = route.split(/[?#]/)[0].replace(/\/$/, "")
      if (clean === "") return existsSync(join(REPO_ROOT, "app/page.tsx"))
      const rel = clean.replace(/^\//, "")
      return [`app/${rel}/page.tsx`, `app/(admin)/${rel}/page.tsx`].some((f) => existsSync(join(REPO_ROOT, f)))
    }
    const missing = siteStructure().flatMap((area) =>
      area.groups.flatMap((group) =>
        [group, ...group.children]
          .map((node) => node.path)
          .filter((path): path is string => Boolean(path))
          .filter((path) => !pageExists(path))
          .map((path) => `${area.id}: ${path}`),
      ),
    )
    expect(missing).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --config qa/config/vitest.config.mts qa/unit/showcase/site-structure.test.ts`
Expected: FAIL — `Cannot find package '@/features/showcase/lib/domain/site-structure'`

- [ ] **Step 3: Write minimal implementation**

Create `features/showcase/lib/domain/site-structure.ts`:

```ts
import { mainNav } from "@/components/layout/main-nav"
import { adminNav } from "@/features/admin"
import { DOC_AUDIENCES, DOC_CATEGORY_AUDIENCE, docAudienceMeta } from "@/features/docs"

/**
 * The site's shape, read from the three navigations that actually drive it.
 *
 * Nothing here is written down twice. The previous site-map slide was a hand
 * kept list and had drifted from the app: it omitted About and Contact, which
 * are top-level nav, and listed Checkout and Account, which are not.
 */
export type AreaId = "overview" | "storefront" | "admin" | "docs"
export type StructureNode = { label: string; path?: string; note?: string }
export type StructureGroup = { label: string; path?: string; children: StructureNode[] }
export type StructureArea = {
  id: AreaId
  heading: string
  /** Who this front door is for. */
  forWhom: string
  groups: StructureGroup[]
}

/** The Articles dropdown is built from the newest posts, so its children would date the slide. */
const ARTICLES_NOTE = "3 most recent, generated"

function storefrontGroups(): StructureGroup[] {
  return mainNav.map((item) => ({
    label: item.label,
    path: item.href,
    children:
      item.label === "Articles"
        ? [{ label: "Latest posts", note: ARTICLES_NOTE }]
        : (item.sections ?? []).map((section) => ({ label: section.label, path: section.href })),
  }))
}

function adminGroups(): StructureGroup[] {
  return adminNav.map((item) => ({
    label: item.label,
    path: item.href,
    children: (item.children ?? [])
      .filter((child) => child.href !== item.href)
      .map((child) => ({ label: child.label, path: child.href })),
  }))
}

function docsGroups(): StructureGroup[] {
  return DOC_AUDIENCES.map((audience) => ({
    label: docAudienceMeta[audience].label,
    children: Object.entries(DOC_CATEGORY_AUDIENCE)
      .filter(([, owner]) => owner === audience)
      .map(([category]) => ({ label: category })),
  }))
}

function overviewGroups(): StructureGroup[] {
  return [
    { label: "Storefront", children: [{ label: "What customers see" }] },
    { label: "Admin", children: [{ label: "What the owner runs" }] },
    { label: "Docs", children: [{ label: "What teams inherit" }] },
  ]
}

export function siteStructure(): StructureArea[] {
  return [
    { id: "overview", heading: "One repo, three front doors.", forWhom: "Everyone", groups: overviewGroups() },
    { id: "storefront", heading: "What customers see.", forWhom: "Shoppers", groups: storefrontGroups() },
    { id: "admin", heading: "What the owner sees.", forWhom: "Whoever runs the store", groups: adminGroups() },
    { id: "docs", heading: "What teams inherit.", forWhom: "Developers, CTOs and content owners", groups: docsGroups() },
  ]
}

export function getArea(id: AreaId): StructureArea {
  const area = siteStructure().find((candidate) => candidate.id === id)
  if (!area) throw new Error(`unknown structure area: ${id}`)
  return area
}
```

`docsGroups` deliberately does **not** drop an audience with no categories. Filtering it out would make the "covers every docs audience" test fail with a confusing message; leaving it in makes an empty audience show as an empty group, which the next step's test rejects by name. Either way it is loud, and loud is the point.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm vitest run --config qa/config/vitest.config.mts qa/unit/showcase/site-structure.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Check the arch ratchet still holds**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm arch`
Expected: `deepImports 0`, no regressions. If `deepImports` moved off 0, an import went to a slice's internals instead of its index — fix the import, do not update the baseline.

- [ ] **Step 6: Commit**

```bash
git add features/showcase/lib/domain/site-structure.ts qa/unit/showcase/site-structure.test.ts
git commit -m "S48: derive the site structure from the real navigation"
```

---

### Task 2: A `structure` slide kind

**Files:**
- Modify: `features/showcase/lib/domain/infographics.ts` (union + `INFOGRAPHIC_KINDS`)
- Create: `features/showcase/components/structure-body.tsx`
- Modify: `features/showcase/components/infographic-slide.tsx` (switch arm)
- Test: `qa/unit/showcase/slide-kinds.test.ts`

**Interfaces:**
- Consumes: `getArea`, `StructureArea` from Task 1.
- Produces: the `structure` member of `Infographic` — `{ kind: "structure"; area: AreaId }` — and `StructureBody({ area })`.

- [ ] **Step 1: Write the failing test**

Append to `qa/unit/showcase/slide-kinds.test.ts`:

```ts
describe("structure slides", () => {
  const structures = infographics.filter((i) => i.kind === "structure")

  it("renders one slide per area, each naming its own area once", () => {
    expect(structures.map((s) => (s as Extract<Infographic, { kind: "structure" }>).area)).toEqual([
      "overview",
      "storefront",
      "admin",
      "docs",
    ])
  })

  it("prints the groups of the area it names", () => {
    const admin = structures.find((s) => (s as Extract<Infographic, { kind: "structure" }>).area === "admin")!
    const html = render(admin)
    for (const group of getArea("admin").groups) expect(html).toContain(group.label)
  })

  it("types no measured number into a structure slide", () => {
    for (const slide of structures) expect(findHardCodedNumbers(slide)).toEqual([])
  })

  it("renders a group with no children as a leaf, with no empty list", () => {
    // Orders and Analytics have no sub-items. An empty <ul> would draw a rule
    // under them and read as a missing section.
    const admin = getArea("admin")
    const leaf = admin.groups.find((group) => group.children.length === 0)
    expect(leaf, "the admin nav has a childless group to exercise").toBeDefined()
    const html = render(structures.find((s) => (s as Extract<Infographic, { kind: "structure" }>).area === "admin")!)
    expect(html).toContain(leaf!.label)
    expect(html).not.toMatch(/<ul[^>]*>\s*<\/ul>/)
  })
})
```

Add to that file's imports: `import { getArea } from "@/features/showcase/lib/domain/site-structure"`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm vitest run --config qa/config/vitest.config.mts qa/unit/showcase/slide-kinds.test.ts`
Expected: FAIL — `expected [] to deeply equal [ 'overview', 'storefront', 'admin', 'docs' ]` (no structure slides exist yet)

- [ ] **Step 3: Add the kind to the domain**

In `features/showcase/lib/domain/infographics.ts`, add the import and union member, and register the kind:

```ts
import type { AreaId } from "./site-structure"
```

```ts
  | (Base & { kind: "structure"; area: AreaId })
```

Add `"structure"` to `INFOGRAPHIC_KINDS`.

- [ ] **Step 4: Write the body component**

Create `features/showcase/components/structure-body.tsx`:

```tsx
import { getArea, type AreaId } from "../lib/domain/site-structure"

/**
 * One area's tree, one slide. The previous site map put three columns on a
 * single page; they outgrew it and the footer was drawn over them. One tree per
 * slide means the page cannot overfill however the nav grows.
 */
export function StructureBody({ area }: { area: AreaId }) {
  const { groups, forWhom } = getArea(area)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <p className="font-mono text-xl uppercase tracking-widest text-muted-foreground">{forWhom}</p>
      <ul className="grid flex-1 content-start gap-x-10 gap-y-6" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
        {groups.map((group) => (
          <li key={group.label} className="flex flex-col gap-2 border-t border-border pt-4">
            <span className="text-3xl font-semibold leading-tight">{group.label}</span>
            {group.path ? <span className="font-mono text-lg text-muted-foreground">{group.path}</span> : null}
            {group.children.length > 0 ? (
              <ul className="flex flex-col gap-1 pt-1">
                {group.children.map((child) => (
                  <li key={child.label} className="text-xl leading-snug text-muted-foreground">
                    {child.label}
                    {child.note ? <span className="text-primary"> · {child.note}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

A group with no children renders as a heading and its path, with no empty list — which is the `Orders` and `Analytics` case.

- [ ] **Step 5: Wire the switch arm**

In `features/showcase/components/infographic-slide.tsx`, add the import and the case:

```tsx
import { StructureBody } from "./structure-body"
```

```tsx
    case "structure":
      return <StructureBody area={infographic.area} />
```

- [ ] **Step 6: Run the test**

Run: `pnpm vitest run --config qa/config/vitest.config.mts qa/unit/showcase/slide-kinds.test.ts`
Expected: still FAIL on the first assertion (the kind exists, but no slides use it yet). The second and third assertions cannot pass until Task 3 adds the registry entries — that is expected, and Task 3 closes it.

- [ ] **Step 7: Commit**

```bash
git add features/showcase/lib/domain/infographics.ts features/showcase/components/structure-body.tsx features/showcase/components/infographic-slide.tsx qa/unit/showcase/slide-kinds.test.ts
git commit -m "S48: add a structure slide kind that renders one area per page"
```

---

### Task 3: The four slides, and retire the old one

**Files:**
- Modify: `features/showcase/lib/domain/infographic-registry.ts:81-120` (replace the `site-map` entry with four `structure` entries)
- Modify: `features/showcase/lib/domain/infographics.ts` (drop the `site-map` union member and `INFOGRAPHIC_KINDS` entry)
- Modify: `features/showcase/components/infographic-parts.tsx:75` (delete `SiteMapBody`)
- Modify: `features/showcase/components/infographic-slide.tsx` (delete the `site-map` case and import)
- Modify: `features/showcase/lib/domain/packs.ts:94`
- Modify: `qa/unit/showcase/infographics.test.ts:50-70,130+`
- Modify: `qa/unit/showcase/topic-carousels.test.ts:74-78`
- Modify: `qa/smoke/showcase-brand.spec.ts:23`

**Interfaces:**
- Consumes: the `structure` kind from Task 2.
- Produces: slide ids `tour-structure-overview`, `tour-structure-storefront`, `tour-structure-admin`, `tour-structure-docs`, which `asset-paths.ts` publishes to `social/site-tour/structure-*.png` via the existing `tour-` prefix rule.

- [ ] **Step 1: Update the tests that name the old slide**

In `qa/unit/showcase/infographics.test.ts`, replace `"site-map"` with `"structure"` in the kind list (around line 58). Replace the whole `describe("site map infographic")` block (line 130 onward) with nothing — its route-existence check now lives in `qa/unit/showcase/site-structure.test.ts` from Task 1, against derived data rather than a hand list.

In `qa/unit/showcase/topic-carousels.test.ts`, replace the first assertion of `"opens on the site map, then one recorded still per stop"`:

```ts
  it("opens on four structure slides, then one recorded still per stop", () => {
    expect(pack.slides.slice(0, 4).map((s) => s.id)).toEqual([
      "tour-structure-overview",
      "tour-structure-storefront",
      "tour-structure-admin",
      "tour-structure-docs",
    ])
    expect(slides.slice(4, -1).map((s) => s.id)).toEqual(TOUR_STOPS.map((s) => `tour-${s.id}`))
  })
```

In `qa/smoke/showcase-brand.spec.ts`, change `"/showcase-render/infographic-site-map"` to `"/showcase-render/tour-structure-admin"`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run --config qa/config/vitest.config.mts qa/unit/showcase`
Expected: FAIL in `infographics.test.ts` (`structure` has 0 core entries, expected 1) and `topic-carousels.test.ts` (pack still opens on `infographic-site-map`).

- [ ] **Step 3: Replace the registry entry**

In `features/showcase/lib/domain/infographic-registry.ts`, delete the `infographic-site-map` entry (lines 81 to the end of its `areas` array) and put four entries in its place:

```ts
  {
    id: "tour-structure-overview",
    kind: "structure",
    area: "overview",
    format: "carousel",
    eyebrow: "What is in the box",
    title: "One repo, three front doors.",
    summary: "A storefront to shop, an admin to run it, and docs so a team can take it over.",
  },
  {
    id: "tour-structure-storefront",
    kind: "structure",
    area: "storefront",
    format: "carousel",
    eyebrow: "Storefront",
    title: "What customers see.",
    summary: "Five sections, each opening on the pages beneath it.",
  },
  {
    id: "tour-structure-admin",
    kind: "structure",
    area: "admin",
    format: "carousel",
    eyebrow: "Admin",
    title: "What the owner sees.",
    summary: "Theme, catalogue, orders, customers and email, each with its own screens.",
  },
  {
    id: "tour-structure-docs",
    kind: "structure",
    area: "docs",
    format: "carousel",
    eyebrow: "Documentation",
    title: "What teams inherit.",
    summary: "Guides grouped by who needs them, with the owner's commercial material gated.",
  },
```

No counts are typed into this copy. If a later pass wants the measured numbers on the overview slide, bind them to `routes.pages` and `docs.pages` through a `FactRef`, never as literals.

- [ ] **Step 4: Delete the retired kind**

- In `features/showcase/lib/domain/infographics.ts`, remove the `site-map` union member and the `"site-map"` entry from `INFOGRAPHIC_KINDS`.
- In `features/showcase/components/infographic-parts.tsx`, delete `SiteMapBody` entirely.
- In `features/showcase/components/infographic-slide.tsx`, delete the `case "site-map":` arm and remove `SiteMapBody` from the import list.

- [ ] **Step 5: Repoint the carousel**

In `features/showcase/lib/domain/packs.ts`, replace the single site-map slide in the `site-tour` pack:

```ts
    slides: [
      { id: "tour-structure-overview", role: "architecture" },
      { id: "tour-structure-storefront", role: "architecture" },
      { id: "tour-structure-admin", role: "architecture" },
      { id: "tour-structure-docs", role: "architecture" },
      ...TOUR_STOPS.map((s) => ({ id: `tour-${s.id}`, role: "example" as const })),
      { id: "carousel-cta", role: "close" },
    ],
```

- [ ] **Step 6: Run the full unit suite**

Run: `pnpm exec tsc --noEmit && pnpm test:unit`
Expected: PASS. `tsc` is the safety net for the deleted kind — any remaining reference to `site-map` is a type error.

- [ ] **Step 7: Commit**

```bash
git add features/showcase qa/unit/showcase qa/smoke/showcase-brand.spec.ts
git commit -m "S48: four derived structure slides replace the site map"
```

---

### Task 4: Guard against a slide overflowing its page

**Files:**
- Create: `qa/smoke/slide-overflow.spec.ts`

**Interfaces:**
- Consumes: the render route `/showcase-render/<id>` and `[data-social-asset]`, which every slide carries.
- Produces: nothing other code imports.

- [ ] **Step 1: Write the test**

Create `qa/smoke/slide-overflow.spec.ts`:

```ts
import { expect, test } from "@playwright/test"
import { infographics } from "@/features/showcase/lib/domain/infographics"
import { socialAssets } from "@/features/showcase/lib/domain/social-assets"

/**
 * A slide whose content outgrows its page does not scroll — the frame is
 * `overflow-hidden`, so the overspill is simply drawn over the signature. That
 * is how the site map shipped with its footer across two columns. Catching it
 * needs the rendered page, because it depends on fonts and wrapping.
 */
const SLIDE_IDS = [...infographics.map((i) => i.id), ...socialAssets.map((a) => a.id)]

for (const id of SLIDE_IDS) {
  test(`${id} fits its page`, async ({ page }) => {
    await page.goto(`/showcase-render/${id}`, { waitUntil: "networkidle" })
    const overflow = await page.locator("[data-social-asset]").first().evaluate((el) => ({
      content: el.scrollHeight,
      page: el.clientHeight,
    }))
    expect(
      overflow.content,
      `content is ${overflow.content}px in a ${overflow.page}px page`,
    ).toBeLessThanOrEqual(overflow.page)
  })
}
```

- [ ] **Step 2: Run it across every slide and record the result**

Run: `pnpm exec playwright test --config qa/config/playwright.config.mts slide-overflow`
Expected: PASS for the four new structure slides. **If any other slide fails, stop and report the list before changing it** — the spec names this as the one risk that can grow the sprint. Fix them by reducing content or splitting the slide; do not weaken the assertion.

- [ ] **Step 3: Prove the guard bites**

Temporarily add a tenth group to the admin area in `site-structure.ts` (duplicate one entry), re-run the spec, and confirm `tour-structure-admin` fails with the pixel counts in the message. Revert the duplicate.

Run: `pnpm exec playwright test --config qa/config/playwright.config.mts slide-overflow`
Expected: FAIL on `tour-structure-admin`, then PASS again after reverting.

- [ ] **Step 4: Commit**

```bash
git add qa/smoke/slide-overflow.spec.ts
git commit -m "S48: fail the build when a slide outgrows its page"
```

---

### Task 5: Knock-ons, re-export and ship

**Files:**
- Modify: `features/docs/content/social-launch-kit.ts:105` (the `/showcase/social/shared/site-map.png` image block)
- Modify: `features/docs/content/social-launch-kit-carousels.ts:116` (the site-tour page table)
- Modify: `docs/showcase-pipeline.md`
- Delete: `public/showcase/social/shared/site-map.png`

**Interfaces:**
- Consumes: the slide ids from Task 3.
- Produces: the committed PDFs and PNGs.

- [ ] **Step 1: Repoint the launch kit**

In `features/docs/content/social-launch-kit.ts`, change the site-map image block to the new overview slide:

```ts
    {
      type: "image",
      src: "/showcase/social/site-tour/structure-overview.png",
      alt: "Slide naming the three areas of the site: a storefront to shop, an admin to run it, and documentation for the team that inherits it.",
      caption: "One repo, three front doors. Opens the site tour carousel.",
      width: 1080,
      height: 1350,
    },
```

In `features/docs/content/social-launch-kit-carousels.ts`, replace the first table row and renumber the rest so the table lists ten pages:

```ts
      ["1", "/showcase/social/site-tour/structure-overview.png", "One repo, three front doors"],
      ["2", "/showcase/social/site-tour/structure-storefront.png", "What customers see"],
      ["3", "/showcase/social/site-tour/structure-admin.png", "What the owner sees"],
      ["4", "/showcase/social/site-tour/structure-docs.png", "What teams inherit"],
      ["5", "/showcase/social/site-tour/storefront.png", "Real product pages, ready to sell"],
      ["6", "/showcase/social/site-tour/checkout.png", "Discounts show instantly in the total"],
      ["7", "/showcase/social/site-tour/products.png", "Stock and waiting lists at a glance"],
      ["8", "/showcase/social/site-tour/campaigns.png", "Campaigns without a developer"],
```

Keep the existing final rows for the analytics still and the CTA, renumbered to 9 and 10. Bump `updatedAt` on the launch kit doc.

- [ ] **Step 2: Run the unit suite to catch a stale media reference**

Run: `pnpm test:unit`
Expected: PASS. `social-launch-pack.test.ts` fails on a `/showcase/...` path that is not in `public/`, so a wrong filename here is caught now rather than in the export.

- [ ] **Step 3: Re-export**

Run: `pnpm showcase:assets`
Expected: 67+ passed. The four structure PNGs appear under `public/showcase/social/site-tour/`, and `site-tour/carousel.pdf` grows to ten pages.

- [ ] **Step 4: Delete the retired asset**

```bash
git rm public/showcase/social/shared/site-map.png
```

Run: `pnpm test:unit`
Expected: PASS — nothing references it any more.

- [ ] **Step 5: Check the PDF by eye**

Open `public/showcase/social/site-tour/carousel.pdf`. Confirm ten pages, that no page draws content over the signature, and that the four structure pages carry the AduDev wordmark and orange accent.

- [ ] **Step 6: Document the rule**

In `docs/showcase-pipeline.md`, under the section on where slide text lives, add:

```markdown
The site tour opens on four structure slides derived from the app's real navigation (`features/showcase/lib/domain/site-structure.ts`) — the storefront mega-nav, the admin sidebar and the docs taxonomy. Nothing in them is hand-listed. Add a nav item and `qa/unit/showcase/site-structure.test.ts` fails until it appears on a slide; make a slide too tall and `qa/smoke/slide-overflow.spec.ts` fails with the pixel counts.
```

- [ ] **Step 7: Run every gate**

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm arch
pnpm test:unit && pnpm test:integration
pnpm test:smoke && pnpm test:axe && pnpm test:seo
```

Expected: all pass, `arch` with no regressions.

- [ ] **Step 8: Commit and open the PR**

```bash
git add -A
git commit -m "S48: re-export the site tour with its derived structure slides"
git push -u origin v0/s48-site-map-carousel
```

Open the PR against `main` with what changed, why, the tests run, and `Data impact: none`. Wait for CI, squash-merge, then add the S48 ledger row to `docs/next-steps.md` in its own small PR.
