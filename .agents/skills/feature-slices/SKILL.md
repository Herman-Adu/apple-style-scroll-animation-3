---
name: feature-slices
description: Where code lives in this repo - 100% feature-sliced domain code under features/<slice> with public index.ts entry points, the app to features to lib dependency direction, and a partial (~60%) atomic design for shared UI - atoms and molecules only, no organisms or templates folders. Use when creating a file or component, moving code, importing across features, deciding between lib/, components/ and features/, splitting a large file, or reviewing imports.
---

# Feature slices

Two rules, deliberately different strengths:

- **Feature slices: 100%.** Every piece of domain code (anything that knows about orders, products, email, customers...) lives in `features/<slice>`. No exceptions.
- **Atomic design: ~60%.** We use the bottom two levels only: atoms and molecules. We do **not** create `organisms/`, `templates/` or `pages/` folders, because they grow into huge grab-bag folders that are cut by size, not by feature, and nobody can find anything. Organisms belong to the feature that uses them.

## Layout

```
features/<slice>/
  index.ts      public, client-safe surface: export only what other code needs
  server.ts     public server-only surface (optional)
  actions.ts    public server actions (optional; requireAdmin → zod → rule → db → updateTag)
  components/   UI and context providers for this slice (server by default)
  hooks/        client hooks used only by this slice
  lib/          everything else, grouped into sub-folders when it grows:
                api.ts, schema.ts, mappers.ts, types.ts, actions/, data/, ...
  content/      static content files (docs only)
```

The slice root holds **only** the three entry files; every other file lives in one of the four folders. Root `lib/` holds shared infrastructure only (`auth`, `data`, `db`, `seo`, `strapi`, `stripe` + `env`, `format`, `nav`, `types`, `utils`). `qa/unit/meta/folder-layout.test.ts` enforces both. Create only the folders a slice needs. Current slices: admin, articles, catalog, checkout, customers, discount-codes, docs, email, orders, products, reviews, settings, showcase, timeline.

## Dependency direction

```
app/  →  features/<slice>/index.ts  →  lib/  →  components/ui
```

- `app/` routes stay thin: they read params, call the slice and render.
- **Import a slice only through its `index.ts`** (`@/features/orders`, not `@/features/orders/lib/totals`). Deep imports couple you to internals.
- **`lib/` never imports `features/`.** If `lib/` needs it, it's either domain code (move it into a slice) or the slice should pass it in.
- Slice-to-slice imports are allowed only through `index.ts`, and should be rare. If two slices need the same thing, move it down to `lib/` (infra) or into the slice that owns the concept.
- `admin` composes other slices' public APIs. It shouldn't re-implement their rules.

## What belongs in lib/

Only cross-cutting infrastructure: `lib/auth`, the db client, `lib/seo`, `lib/strapi`, utils, env. Domain logic (orders, catalog, offers) belongs in a slice.

### The four-folder convention (R6)

Any `lib/` or slice `lib/` folder that mixes pure rules, repos and framework adapters gets split into:

```
domain/     pure rules and types, no I/O (e.g. permissions, config)
data/       repo-style reads/writes against a store (e.g. lock-rights-repo)
adapters/   framework/provider glue — the only place allowed to import a provider SDK
            or a Next.js server API directly (e.g. auth providers, session cookie/token)
actions.ts  / server.ts / client.ts stay at the folder root as the public entry files
```

`lib/auth/` uses this today (R6). Apply it to a feature's `lib/` only once it has outgrown a
flat folder — small single-purpose folders (`lib/db`, `lib/seo`, `lib/strapi`, `lib/stripe`)
don't need it.

## Where a component goes

| It is...                                                 | Put it in                                             | Examples                               |
| -------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------- |
| Atom: shadcn primitive, no business logic                | `components/ui/`                                      | button, dialog, input                  |
| Molecule: brand design-system piece, no domain knowledge | `components/primitives/` (export from its `index.ts`) | eyebrow, section-heading, glass-panel  |
| App shell shared by every page                           | `components/layout/`, `scroll/`, `theme/`, `seo/`     | site-header, json-ld                   |
| Anything that knows a domain concept (organism)          | `features/<slice>/components/`                        | order-card, sign-in-form, contact-form |

Test: if the component imports a domain type or a slice, or its name contains a domain word, it belongs in a slice.

- Reuse a primitive before writing a new one. Restyle with variants, not copies.
- Never create `components/organisms`, `components/templates` or a new domain folder under `components/`.

## Known drift

These `components/` folders hold domain code from before the rule: `account`, `auth`, `checkout`, `contact`, `home`, `docs`. Don't add to them. When a sprint touches one, move the touched files into the owning slice (`customers`, `admin`/auth, `checkout`, `docs`...) as part of that sprint. Larger moves get their own R-sprint from `architecture-review`.

## Moving code

1. Move it, export it from the new `index.ts`, and update imports.
2. Keep behaviour identical: the existing tests must pass unchanged.
3. Run `.agents/skills/architecture-review/` to confirm deep and inverted import counts went down.
