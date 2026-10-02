---
name: feature-slices
description: Where code lives in this repo - feature-sliced layout under features/<slice>, public index.ts entry points, the app to features to lib dependency direction, and atomic UI in components/ui. Use when creating a file, moving code, importing across features, deciding between lib/ and features/, splitting a large file, or reviewing imports.
---

# Feature slices

Aim for ~60% of domain code inside slices. The rest is shared UI (`components/ui`), cross-cutting infrastructure (`lib/`) and thin routes (`app/`).

## Layout

```
features/<slice>/
  components/   UI for this slice (server by default)
  hooks/        client hooks used only by this slice
  lib/          pure rules and helpers (most unit tests target these)
  api/          server queries / external clients for this slice
  actions.ts    server actions (requireAdmin → zod → rule → db → updateTag)
  schema.ts     zod schemas and inferred types
  mappers.ts    Prisma/CMS rows → domain types
  index.ts      the public surface: export only what other code needs
```

Create only the folders a slice needs. Current slices: admin, articles, catalog, checkout, customers, docs, email, orders, products, showcase, timeline.

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

## Atomic UI

- `components/ui/`: shadcn primitives (atoms). Don't put business logic here.
- Slice `components/`: molecules and organisms built from the primitives.
- Reuse a primitive before writing a new one. Restyle with variants, not copies.

## Moving code

1. Move it, export it from the new `index.ts`, and update imports.
2. Keep behaviour identical: the existing tests must pass unchanged.
3. Run `.agents/skills/architecture-review/` to confirm deep and inverted import counts went down.
