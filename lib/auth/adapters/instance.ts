import "server-only";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { dash } from "@better-auth/infra";

import { prisma } from "@/lib/db/prisma";
import { resolveRole } from "@/lib/auth/domain/config";
import { getBaseUrl } from "@/lib/seo/site";

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
const isDev = process.env.NODE_ENV === "development";

function normalizeOrigin(
  value: string | undefined,
  mode: "url" | "host" = "url",
): string | null {
  if (!value) return null;

  try {
    if (mode === "host") return new URL(`https://${value}`).origin;
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function buildTrustedOrigins(): string[] {
  const origins = new Set<string>();

  const canonicalOrigin = getBaseUrl();
  origins.add(canonicalOrigin);

  const configuredAuthOrigin = normalizeOrigin(process.env.BETTER_AUTH_URL);
  if (configuredAuthOrigin) origins.add(configuredAuthOrigin);

  const productionHostOrigin = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    "host",
  );
  if (productionHostOrigin) origins.add(productionHostOrigin);

  const vercelPreviewOrigin = normalizeOrigin(process.env.VERCEL_URL, "host");
  if (vercelPreviewOrigin) origins.add(vercelPreviewOrigin);

  if (isDev) {
    origins.add("http://localhost:3000");
    const devOrigins = [
      process.env.V0_RUNTIME_URL,
      process.env.V0_DEV_APP_URL,
      process.env.V0_BUILD_URL,
      process.env.V0_SANDBOX_URL,
    ];
    for (const candidate of devOrigins) {
      const origin = normalizeOrigin(candidate);
      if (origin) origins.add(origin);
    }
  }

  return [...origins];
}

const canonicalOrigin = getBaseUrl();
const configuredAuthOrigin = normalizeOrigin(process.env.BETTER_AUTH_URL);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  baseURL: configuredAuthOrigin ?? canonicalOrigin,

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
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
          const role = resolveRole(user.email);
          return {
            data: {
              ...user,
              role,
              roleOverride: role === "admin" ? "admin" : null,
            },
          };
        },
      },
    },
  },

  trustedOrigins: buildTrustedOrigins(),

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

  // `dash()` exposes the @better-auth/infra endpoints that dash.better-auth.com
  // probes to verify ownership of this auth server. `nextCookies()` must stay
  // last so it can attach Set-Cookie headers after every other plugin runs.
  plugins: [
    ...(process.env.BETTER_AUTH_API_KEY
      ? [dash({ apiKey: process.env.BETTER_AUTH_API_KEY })]
      : []),
    nextCookies(),
  ],
});
