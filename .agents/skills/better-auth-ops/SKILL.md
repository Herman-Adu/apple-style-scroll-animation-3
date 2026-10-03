---
name: better-auth-ops
description: Authentication work on this repo with Better Auth on Prisma and Neon - requireAdmin in every admin server action, permission rules in lib/auth/permissions.ts, protected user fields, the Better Auth CLI for schema generation, and dev cookie and trusted-origin settings. Use for sign-in, sign-up, sessions, roles, admin access, permissions, login loops, cookie problems, or adding auth fields and plugins.
---

# Better Auth operations

- `lib/auth/instance.ts`: the `betterAuth()` instance (prismaAdapter, `additionalFields`, `trustedOrigins`, cookies, plugins with `nextCookies()` last).
- `lib/auth/`: `config.ts` (admin email allowlist and role precedence via one resolver), `server.ts` (`getSession`, `requireAdmin`), `permissions.ts` (pure rules), `adapters/` (db / local / strapi), `auth-context.tsx` (client).

Load the generic `better-auth` platform skill only when you edit `lib/auth/instance.ts` or add a plugin.

## Authorisation (every change)

- Every admin server action starts with `await requireAdmin()`, on its first line, before parsing input.
- Permission decisions are pure functions in `lib/auth/permissions.ts`, unit-tested in `qa/unit/auth/`. Components and actions call them; they never inline role checks.
- `proxy.ts` gates `/admin` routes as defence in depth only. Never rely on it alone.
- Never trust role or ownership fields from the client.

## Adding user fields or plugins

1. Test first: write a unit test for the permission rule and an integration test for the persisted field.
2. In `lib/auth/instance.ts`, add the field under `user.additionalFields`. Use `input: false` for anything security-relevant (as `role`, `status` and `roleOverride` already do), so sign-up can't set it.
3. Generate the Prisma models with the CLI, then apply them via `db-schema-change`:
   ```bash
   pnpm dlx @better-auth/cli@latest generate --config lib/auth/instance.ts --output prisma/schema.prisma
   pnpm exec prisma db push && pnpm exec prisma generate
   ```
   Review the diff. The CLI may reorder models; keep only the auth changes.

## Dev and preview cookies

- Role precedence (override, then stored role, then allowlist) is decided only in `lib/auth/config.ts`. Don't re-derive it elsewhere.
- In development, `lib/auth/instance.ts` uses `advanced.defaultCookieAttributes: { sameSite: "none", secure: true }`, so the v0 preview iframe keeps the session.
- `trustedOrigins` must include localhost and the preview and production origins. A login loop usually means a missing origin or a cookie blocked in the iframe.
- `BETTER_AUTH_SECRET` comes from env only. Never log or print it.

## Testing auth in the browser

`/admin` redirects to `/sign-in` without a session. Use `QA_ADMIN_EMAIL` / `QA_ADMIN_PASSWORD` from Vars if they're set; otherwise ask the user to add them (in Vars, never in chat).
