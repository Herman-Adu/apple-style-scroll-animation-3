import "server-only"

import { PrismaClient } from "@prisma/client"

/**
 * Server-only singleton PrismaClient. In development Next.js clears the module
 * cache on every request, which would otherwise open a new pool of connections
 * on each reload and exhaust Neon — so we cache the instance on globalThis.
 *
 * Runtime uses the pooled Neon connection (POSTGRES_PRISMA_URL, PgBouncer-ready);
 * `prisma db push` / migrations use the direct URL (DATABASE_URL_UNPOOLED). See
 * prisma/schema.prisma.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
