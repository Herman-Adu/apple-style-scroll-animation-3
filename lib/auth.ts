import "server-only"

import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { nextCookies } from "better-auth/next-js"

import { prisma } from "@/lib/db/prisma"
import { resolveRole } from "@/lib/auth/config"

/**
 * Better Auth server — the permanent owner of identity and sessions.
 *
 * Identity lives in Postgres (Neon) via the Prisma adapter. App-specific fields
 * (role/status/onboardingStatus/roleOverride) are declared as `additionalFields`
 * with `input: false`, so they exist on the user row and are returned in the
 * session, but a client can never set them at sign-up. `profile` and `offers`
 * are plain JSON columns written only by server actions.
 *
 * Admin bootstrap: on user creation the role is resolved from the email
 * allowlist (see config.ts). Everyone else is a customer. After creation the
 * role lives on the row and is managed from the admin UI via roleOverride.
 */
const isDev = process.env.NODE_ENV === "development"

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "customer", input: false },
      status: { type: "string", required: false, defaultValue: "active", input: false },
      onboardingStatus: {
        type: "string",
        required: false,
        defaultValue: "pending",
        input: false,
      },
      roleOverride: { type: "string", required: false, input: false },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Role is resolved on the server from the trusted email allowlist —
          // never accepted from the client.
          const role = resolveRole(user.email)
          return {
            data: {
              ...user,
              role,
              roleOverride: role === "admin" ? "admin" : null,
            },
          }
        },
      },
    },
  },

  trustedOrigins: [
    ...(isDev
      ? [
          "http://localhost:3000",
          ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
          ...(process.env.V0_DEV_APP_URL ? [process.env.V0_DEV_APP_URL] : []),
          ...(process.env.V0_BUILD_URL ? [process.env.V0_BUILD_URL] : []),
          ...(process.env.V0_SANDBOX_URL ? [process.env.V0_SANDBOX_URL] : []),
        ]
      : []),
    ...(!isDev
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
            ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
            : []),
        ]
      : []),
  ],

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (matches the legacy cookie lifetime)
    updateAge: 60 * 60 * 24, // refresh once per day
  },

  ...(isDev
    ? {
        advanced: {
          // Required by the cross-site v0 preview iframe. Without these
          // attributes, login succeeds but the next request appears signed out.
          defaultCookieAttributes: {
            sameSite: "none" as const,
            secure: true,
          },
        },
      }
    : {}),

  plugins: [nextCookies()],
})
