# S48 — the site map, properly

Branch: `v0/s48-site-map-carousel`. Data impact: **none**.
**Depends on S47 (#189)**, which introduces the shared `SlideShell` these slides
render. S47 must merge first; this branch then rebases onto the new `main`.

---

## Why

Two problems with `shared/site-map.png`, found while reviewing the carousels
before posting.

**It is broken.** The AduDev footer is drawn on top of the Storefront and Admin
columns. `SiteMapBody` stretches to `flex-1` but its content does not shrink, so
three columns of routes overflow the frame and collide with the signature. The
cause is not padding: one slide cannot hold what is already on it.

**It is wrong.** The list was hand-written and has drifted from the app:

| | In the repo | On the slide |
|---|---|---|
| Page routes | **45** | 15 |
| Storefront nav | 5 top-level, **14 static sections + a generated Articles group** | 5 flat links |
| Admin nav | 9 top-level, **12 nested children** | 6 flat links |
| Docs | **55 guides**, 5 audiences, 24 categories | 3 lines |

It omits About and Contact, which are top-level nav items, while listing
Checkout and Account, which are not.

## The story worth telling

The site does not have one navigation. It has **three, with different nesting
models**, and they map onto three audiences:

- **Storefront** (`components/layout/main-nav.ts`) — a mega-nav; each of 5 items
  opens 3–4 deep links with hints. The Articles dropdown is generated from the
  three newest posts.
- **Admin** (`features/admin/lib/domain/nav.ts`) — a sidebar with expandable
  disclosures. Customers branches by **query segment** (All / Subscribers /
  Blocked), not by path.
- **Docs** (`features/docs`) — 5 audiences × 24 categories × 55 guides, one tier
  gated to the owner server-side.

"One repo, three front doors" is a better slide than a flat list of paths, and
it is the truth about the app.

## Decided with the owner

| Question | Answer |
|---|---|
| Shape | **Rebuild inside the existing `site-tour` carousel**, not a new one |
| Source of truth | **Derived from the real nav data, with a test** |

A dedicated carousel was rejected because the posting calendar is exactly full
at sixteen slots; `site-tour` already holds one, so this needs no calendar
change.

---

## Design

### 1. `features/showcase/lib/domain/site-structure.ts`

Pure derivation. No new hand-maintained list.

| Source | Import | Gives |
|---|---|---|
| `mainNav` | `@/components/layout/main-nav` | storefront, 5 groups → 14 static + 1 generated |
| `adminNav` | `@/features/admin` | admin, 9 → 12 |
| docs taxonomy | `@/features/docs` | 5 audiences, 24 categories, 55 guides |

`adminNav` and the docs taxonomy are exported from their slice indexes, so
nothing here is a deep import and the `deepImports: 0` ratchet holds.

```ts
export type AreaId = "overview" | "storefront" | "admin" | "docs"
export type StructureNode = { label: string; path?: string; note?: string }
export type StructureGroup = { label: string; path?: string; children: StructureNode[] }
export type StructureArea = {
  id: AreaId
  heading: string
  /** Who this front door is for, printed under the heading. */
  forWhom: string
  groups: StructureGroup[]
}

export function siteStructure(): StructureArea[]
```

Icons and React are dropped in the mapping; the domain module returns plain data.

**The Articles node.** Its children are the three newest article titles, which
would date the slide and say nothing about structure. It renders as a single
node noted *"3 most recent, generated"* instead — which is the more interesting
fact, because it shows the nav is data-driven rather than hand-listed.

### 2. A `structure` slide kind

Replace the `site-map` kind, whose only user is the slide being deleted. The new
kind carries an area id and nothing else:

```ts
| (Base & { kind: "structure"; area: AreaId })
```

The body resolves `siteStructure()` at render and draws one area as a tree.
Counts bind to existing facts — `routes.pages` (45) and `docs.pages` (55) — so
no number is typed by hand and `findHardCodedNumbers` stays satisfied.

**Each slide holds exactly one tree**, so the overflow that caused the footer
collision cannot recur. It is fixed by construction rather than by tuning.

### 3. Four slides, then the carousel

| # | Slide | Content |
|---|---|---|
| 1 | One repo, three front doors | the three areas with their counts; `routes.pages` |
| 2 | What customers see | storefront tree, 5 groups → 14 children + the generated Articles node |
| 3 | What the owner sees | admin tree, 9 groups → 12 children |
| 4 | What teams inherit | 5 audiences, 24 categories, `docs.pages` guides, owner tier flagged |

Slide ids take the `tour-` prefix, so `asset-paths.ts` publishes them to
`social/site-tour/` with no change to the layout rules.

`site-tour` becomes **10 pages**: the four above, the five existing stills, the
CTA. It reads structure → reality → ask.

### 4. Tests, written first

**Coverage.** Every top-level `mainNav` item, every top-level `adminNav` item and
every docs audience must appear in the derived structure. Derived from the nav
modules themselves, so adding a nav item fails this test until it reaches a
slide. *This is the test that would have caught the missing About and Contact.*

**No slide overflows its page.** A smoke check that `scrollHeight <= clientHeight`
on every `[data-social-asset]`. This is the guard for the actual bug class, it
covers all 67 assets rather than this one slide, and it should fail today
against `infographic-site-map`.

Existing guards continue to apply: the S47 palette guards, `asset-layout`, and
the facts guard.

## Knock-ons

- `shared/site-map.png` is deleted, and the launch kit's image block pointing at
  it is updated. `social-launch-pack.test.ts` already fails on a reference to
  missing media, so a miss here is caught.
- `pnpm showcase:assets` re-export.
- Posting calendar unchanged.

## Risks

**The overflow test may fail on slides beyond this one.** It has not been run
yet. If other slides overflow, they get fixed in this sprint rather than the
test being weakened — which could make the sprint larger than four slides. The
count will be reported before any of them are touched.

**`main-nav.ts` lives in `components/layout/`** and pulls in `getAllArticles()`
and lucide icons. Importing it into a domain module is legal and not a deep
import, but it is a slightly odd direction. Moving it to `lib/` would be
cleaner and is deliberately **not** done here: it would touch the live
storefront nav immediately before a launch, for tidiness rather than need.

## Out of scope

No recording, no reseeding, no new carousel, no posting-calendar change. The
five site-tour stills are reused as they are.

## Order of work

1. Merge S47 (#189); rebase this branch onto the new `main`.
2. Write both tests; watch the overflow test fail on the current slide and the
   coverage test fail on the absent module.
3. Build `site-structure.ts` until coverage passes.
4. Build the `structure` kind and the four slides; watch the overflow test pass.
5. Repoint the `site-tour` pack; delete the old slide and its asset; fix the
   launch kit reference.
6. `tsc`, lint, arch, unit, integration, smoke, axe, seo.
7. Re-export, review the rendered PDF, then PR.
