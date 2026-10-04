import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Slice indexes export "use server" actions, so server code that imports a slice
 * (cart, settings, orders...) also loads the checkout action module. The Stripe
 * client must therefore be created on first use, not at import time, or every page
 * would crash when `STRIPE_SECRET_KEY` is unset.
 */
vi.mock("server-only", () => ({}));

const loadWithKey = async (key: string | undefined) => {
  vi.resetModules();
  vi.doMock("@/lib/env", () => ({ env: { STRIPE_SECRET_KEY: key } }));
  return import("@/lib/stripe/server");
};

describe("lib/stripe/server", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("can be imported without STRIPE_SECRET_KEY", async () => {
    await expect(loadWithKey(undefined)).resolves.toBeDefined();
  });

  it("getStripe() fails with a clear message when the key is missing", async () => {
    const { getStripe } = await loadWithKey(undefined);
    expect(() => getStripe()).toThrow(/STRIPE_SECRET_KEY is not set/);
  });

  it("getStripe() creates the client once and reuses it", async () => {
    const { getStripe } = await loadWithKey("sk_test_unit_placeholder");
    expect(getStripe()).toBe(getStripe());
  });
});
