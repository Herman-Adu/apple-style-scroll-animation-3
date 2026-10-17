# S69 copy inventory — every string in the four `hero` blocks

Transcribed 2026-10-17 from `features/products/lib/data/data.ts` **before any
renderer was deleted**, as `docs/hand-off/product-hero-sprint.md` section 7
requires. This is the record the copy-survival test
(`qa/unit/products/hero-copy-survives.test.ts`) is written from, so that the
strings are pinned by a test rather than by care.

Animation-only fields (`align`, `window`, `index`, `motion`, `scrollVh`,
`assembledY`, `explodedY`, `height`, `z`) are deliberately **not** inventoried.
They are the delivery mechanism, and they go with the renderers.

---

## One correction to the brief's count

Section 7 says "Three per product". Counted on this tree it is **ten beats, not
twelve**: Momo X 3, Momo Air 2, Momo Studio 2, Momo Beat 3. The copy-survival
test pins the ten that exist.

---

## Momo X (`momo-x`) — `kind: "frames"`

Intro: `Introducing` / `Momo X` / `Pure Sound. Zero Compromise.`

| # | Title | Description |
|---|---|---|
| 01 | `Designed for\nPrecision.` | Every component engineered with sub-millimeter accuracy for perfect acoustic response. |
| 02 | `Titanium\nPerformance.` | Aerospace-grade materials deliver uncompromising durability and featherlight comfort. |
| 03 | `Hear Beyond.` | 40mm planar drivers. Active noise cancellation. 60-hour battery. Spatial audio ready. |

This hero **survives as-is** — it becomes `cinematicHero`, so its beats are not
rehomed. They are pinned anyway, because the field rename is exactly the kind of
move that drops them silently.

## Momo Air (`momo-air`) — `kind: "parallax"`

Intro: `Introducing` / `Momo Air` / `Weightless. Wireless. Everywhere.`

| # | Title | Description |
|---|---|---|
| 01 | `4.2 grams\nof silence.` | So light you forget it is there — until the noise around you simply vanishes. |
| 02 | `Adaptive\nTransparency.` | Six microphones read your surroundings and let the world back in, exactly as much as you want. |

## Momo Studio (`momo-studio`) — `kind: "parallax"`

Intro: `For the studio` / `Momo Studio` / `Reference Truth.`

| # | Title | Description |
|---|---|---|
| 01 | `Open-back\nby design.` | A ventilated acoustic chamber creates a wide, natural soundstage with zero pressure buildup. |
| 02 | `Hand-matched\ndrivers.` | Every pair is matched to within 0.5dB so left and right are perfectly, provably balanced. |

## Momo Beat (`momo-beat`) — `kind: "exploded"`

Intro: `Sound everywhere` / `Momo Beat` / `Fill the Room.`

| # | Title | Description |
|---|---|---|
| 01 | `Every layer\nengineered.` | Six precision components stack into a machined titanium body no wider than a coffee cup. |
| 02 | `Bass you\nfeel.` | A dedicated full-range driver and opposed passive radiator move real air for depth that belies its size. |
| 03 | `360°\nof sound.` | Assembled, the radial array projects evenly in every direction — no sweet spot, no dead zones. |

Exploded layer labels, in assembly order — product specification, not
decoration, and the component names beat 01 and 02 refer to:

1. `Titanium cap`
2. `360° acoustic grille`
3. `Full-range driver`
4. `Amp & passive radiator`
5. `Machined base`

Beat 01 says "Six precision components" over five layers. That discrepancy is
**pre-existing copy on `main`**, carried across verbatim rather than silently
corrected — rewording the owner's writing is not this sprint's job, and a
paraphrase is exactly what section 7 exists to prevent. Worth his decision
later.

---

## Where each string lands

| Source | Destination |
|---|---|
| `hero.intro` (all four) | `productHero.kicker` / `title` / `subtitle` |
| `hero.beats` on momo-x | stays, inside `cinematicHero` |
| `hero.beats` on air / studio / beat | `features[]`, rendered by the existing `ProductFeatures` |
| `explodedHero.layers[].label` on beat | one `specs[]` row, rendered by the existing `ProductSpecs` |

Beats become features rather than a new section because `ProductFeatures`
already renders a title and a description in the product page's own idiom
(`AGENTS.md` non-negotiable 7). Its `stat` / `statUnit` become optional so a
rehomed beat does not have to invent a number it never had.
