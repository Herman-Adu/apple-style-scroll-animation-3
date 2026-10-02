---
name: db-schema-change
description: Safe Prisma schema and data changes on this repo's Neon Postgres - additive by default, prisma db push plus generate with the project env, integration tests first, a data-impact line in the PR, and an approval gate for anything destructive. Use when editing prisma/schema.prisma, adding a table, column, index or relation, backfilling data, seeding, or seeing Prisma client or type errors after a schema change.
---

# DB schema change (Prisma + Neon)

## Rules

- **Additive by default:** new tables, new nullable columns, columns with defaults, new indexes. Existing data stays untouched.
- **Destructive = gate:** dropping or renaming a column or table, changing a type, adding `NOT NULL` without a default, or deleting or rewriting rows. Stop and get explicit approval first, and say exactly which rows or columns are affected.
- Rename in two sprints: add the new column and dual-write, backfill, switch reads, then (gated) drop the old one.

## Steps

1. **Test first:** write the integration test in `qa/integration/<slice>/` for the new behaviour. It fails because the column or table doesn't exist yet.
2. Edit `prisma/schema.prisma`.
3. Apply and regenerate with the project env:
   ```bash
   set -a && source /vercel/share/.env.project && set +a
   pnpm exec prisma db push      # refuses data loss unless --accept-data-loss (never pass it without a gate)
   pnpm exec prisma generate
   ```
   Outside v0, use `vercel env pull .env.local` (see `vercel-ops`) and the same commands.
4. Update the slice's `mappers.ts` and `schema.ts` (zod) so the new field is typed end to end.
5. `pnpm exec tsc --noEmit && pnpm test:integration`.

## PR body must include

```
Data impact: additive (new nullable column Order.trackingUrl). Existing data untouched.
```

## Gotchas

- `prisma/schema.prisma` reads `POSTGRES_PRISMA_URL` (pooled, runtime) and `directUrl = DATABASE_URL_UNPOOLED` (schema operations). Both must be in the env when you run `db push`.
- Better Auth tables (user, session, account, verification) are generated. Change them through `better-auth-ops`, not by hand.
- Seeds and backfills must be idempotent (`upsert`) and scoped to rows they own.
