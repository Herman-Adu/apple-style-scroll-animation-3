# Conventions

Patterns to follow when extending the app so new code matches the existing architecture.

## Server-first, islands at the leaves

- Default to Server Components. Only add `"use client"` when a component needs browser state, event handlers, or mount/layout-driven animation.
- Do **not** make a presentational component a client component just to animate its entrance. Wrap its markup in `<Reveal>` (`components/primitives`), which is the client island and already respects `prefers-reduced-motion`.
- Never fetch in `useEffect`. Fetch on the server in a page or Server Component and pass data down as props.
- Keep client islands small and low in the tree so they don't pull their subtree into the client bundle.

## Data access goes through the feature `api` layer

- UI and pages import from a feature's public barrel (`features/products`), never from its internals.
- All data reads go through `fetch*` functions in `features/*/api/index.ts`. These are marked `server-only`.
- Never call `fetchStrapi` or touch `lib/data/*` directly from a component. The feature `api` layer is the only thing that decides the source.

## Zod is the trust boundary

- Every piece of external data (CMS or otherwise) is validated with a zod schema before it enters the app.
- Domain types are inferred from schemas (`type Product = z.infer<typeof productSchema>`), never hand-written in parallel.
- Server actions (e.g. `app/contact/actions.ts`) validate their input with zod before doing anything else. Client-side validation is UX only; the server is the authority.

## Mappers are the only CMS-aware transform

- `features/*/mappers.ts` is the single place that knows Strapi field names and media envelopes.
- Mapper **output keys** are the domain contract — don't change them to match the CMS. Change the **right-hand side** (the source field) instead. This keeps every downstream caller stable.
- Let the zod parse that runs right after the mapper be the failure point. Don't defensively coerce bad data into looking valid.

## Cache tags are centralized

- All cache tags come from `lib/strapi/tags.ts`. Fetches attach them; the revalidate webhook consumes them. Add new tags there so producer and consumer can't drift.

## Environment access

- Import `env` from `@/lib/env`. Never read `process.env` directly. See [`environment.md`](environment.md).

## Barrels

- Each feature exposes exactly what's public through `index.ts`. New shared helpers used across the feature go in `lib/` within the feature and are re-exported if part of the public surface.

## Styling

- Tailwind v4 with design tokens (`bg-background`, `text-foreground`, `text-accent-teal`, etc.). Don't hardcode raw colors like `bg-black`/`text-white`.
- Use the spacing scale and `gap-*` utilities; avoid arbitrary values and `space-*`.
- Fonts apply via `font-sans` / `font-mono` classes.

## Accessibility

- Animation-driven components must honor `prefers-reduced-motion` (follow `Reveal` / `page-hero`).
- Keep semantic HTML and ARIA correct; the `qa/axe` suite guards this.
