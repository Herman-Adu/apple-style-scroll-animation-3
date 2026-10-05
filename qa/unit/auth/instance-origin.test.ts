import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeDb } from "@/qa/fakes";

const captured = vi.hoisted(() => ({
  config: null as Record<string, unknown> | null,
}));

vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config: Record<string, unknown>) => {
    captured.config = config;
    return { api: { getSession: vi.fn() } };
  }),
}));

vi.mock("better-auth/adapters/prisma", () => ({
  prismaAdapter: vi.fn(() => ({})),
}));

vi.mock("better-auth/next-js", () => ({
  nextCookies: vi.fn(() => ({ id: "nextCookies" })),
}));

vi.mock("@better-auth/infra", () => ({
  dash: vi.fn(() => ({ id: "dash" })),
}));

vi.mock("@/lib/auth/domain/config", () => ({
  resolveRole: vi.fn(() => "customer"),
}));

function withEnv(overrides: Record<string, string | undefined>) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(overrides)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
}

afterEach(() => {
  captured.config = null;
});

describe("auth instance origin resolution", () => {
  it("uses the canonical site URL as baseURL in production when BETTER_AUTH_URL is unset", async () => {
    fakeDb({}).install();
    const restore = withEnv({
      NODE_ENV: "production",
      BETTER_AUTH_URL: undefined,
      NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "preview.example.vercel.app",
      VERCEL_URL: "other-preview.example.vercel.app",
    });

    try {
      await import("@/lib/auth/adapters/instance");
      expect(captured.config?.baseURL).toBe("https://shop.example.com");
    } finally {
      restore();
    }
  });

  it("trusts the canonical site URL in production trustedOrigins", async () => {
    fakeDb({}).install();
    const restore = withEnv({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
      VERCEL_PROJECT_PRODUCTION_URL: "preview.example.vercel.app",
      VERCEL_URL: "other-preview.example.vercel.app",
    });

    try {
      await import("@/lib/auth/adapters/instance");
      const trustedOrigins = (captured.config?.trustedOrigins ??
        []) as string[];
      expect(trustedOrigins).toContain("https://shop.example.com");
    } finally {
      restore();
    }
  });
});
