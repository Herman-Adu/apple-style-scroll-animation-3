import { describe, expect, it, vi } from "vitest";
import { fakeAuth, fakeDb } from "@/qa/fakes";

const m = vi.hoisted(() => ({
  checkoutCreate: vi.fn(),
  pendingCreate: vi.fn(),
  pendingUpdate: vi.fn(),
  userFindUnique: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    STRIPE_SECRET_KEY: "set",
    NEXT_PUBLIC_SITE_URL: "https://shop.example.com",
  },
}));

vi.mock("@/features/products", () => ({
  products: [
    {
      slug: "momo-x",
      name: "Momo X",
      image: "/products/momo-x.png",
      price: { amount: 349, currency: "GBP" },
    },
  ],
}));

vi.mock("@/features/orders/server", () => ({
  commitStock: vi.fn(async () => ({ reserved: [], crossedLowStock: [] })),
  notifyLowStock: vi.fn(),
  releaseReservationById: vi.fn(async () => {}),
}));

vi.mock("@/features/discount-codes", () => ({
  resolveDiscountCode: vi.fn(async () => ({ ok: false, error: "invalid" })),
}));

vi.mock("@/features/catalog/server", () => ({
  revalidateCatalog: vi.fn(),
}));

vi.mock("@/lib/stripe/server", () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: m.checkoutCreate,
      },
    },
    coupons: { create: vi.fn() },
  })),
}));

m.checkoutCreate.mockResolvedValue({
  id: "cs_test_123",
  client_secret: "cs_secret_123",
});
m.pendingCreate.mockResolvedValue({});
m.pendingUpdate.mockResolvedValue({});
m.userFindUnique.mockResolvedValue({ offers: [] });

describe("startStripeCheckout return origin", () => {
  it("builds return_url from canonical site URL, not forwarded host", async () => {
    fakeAuth({
      session: {
        email: "buyer@example.com",
        role: "customer",
      },
    }).install();

    fakeDb({
      user: { findUnique: m.userFindUnique },
      pendingCheckout: {
        create: m.pendingCreate,
        update: m.pendingUpdate,
      },
    }).install();

    const { startStripeCheckout } =
      await import("@/features/checkout/lib/actions/checkout");

    await startStripeCheckout({
      lines: [{ slug: "momo-x", quantity: 1 }],
    });

    const payload = m.checkoutCreate.mock.calls[0][0] as { return_url: string };
    expect(payload.return_url).toContain(
      "https://shop.example.com/checkout/return",
    );
  });
});
