import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { fakeDb } from "@/qa/fakes";

/**
 * Order finalization is the money-to-order boundary and is reachable from two
 * places at once (the Stripe webhook and the /checkout/return fallback). These
 * tests lock the concurrency guarantees:
 *  - the pending row is CLAIMED atomically before an order is created, so only
 *    one concurrent finalizer wins;
 *  - the loser (and any duplicate event) is a quiet no-op, not a 500;
 *  - unrelated failures still surface so Stripe retries them;
 *  - order numbers are allocated under an advisory lock, before the max lookup.
 *
 * Prisma and the other collaborators are mocked — we assert behaviour and call
 * ordering, not Postgres internals. The real lock needs a live database.
 */
const m = vi.hoisted(() => {
  const calls: string[] = [];
  return {
    calls,
    updateMany: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    orderCreate: vi.fn(),
    executeRaw: vi.fn(),
    queryRaw: vi.fn(),
  };
});

fakeDb({
  pendingCheckout: {
    updateMany: (args: unknown) => m.updateMany(args),
    findUniqueOrThrow: (args: unknown) => m.findUniqueOrThrow(args),
  },
  order: { create: (args: unknown) => m.orderCreate(args) },
  $executeRaw: (...args: unknown[]) => m.executeRaw(...args),
  $queryRaw: (...args: unknown[]) => m.queryRaw(...args),
}).install();

// Heavy / unrelated collaborators imported at module load by checkout-finalize.
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/features/products/data", () => ({ getAllProducts: vi.fn() }));
vi.mock("@/features/products", () => ({
  productSchema: { safeParse: vi.fn() },
}));
vi.mock("@/features/catalog/store", () => ({
  recordSale: vi.fn(),
  toMap: vi.fn(),
}));
vi.mock("@/lib/discount-codes/db-actions", () => ({
  incrementDiscountCodeRedemption: vi.fn(),
}));
vi.mock("@/features/email/actions", () => ({ sendLowStockAlert: vi.fn() }));
vi.mock("@/lib/settings/db-actions", () => ({
  getStoreSettingsAction: vi.fn(),
}));

const PENDING_ID = "pending-1";

const session = (over: Partial<Stripe.Checkout.Session> = {}) =>
  ({
    id: "cs_test_123",
    payment_intent: "pi_test_123",
    metadata: { pendingCheckoutId: PENDING_ID },
    ...over,
  }) as Stripe.Checkout.Session;

const pendingRow = {
  id: PENDING_ID,
  userId: "user-1",
  email: "buyer@example.com",
  items: [
    {
      slug: "momo-x",
      name: "Momo X",
      quantity: 1,
      unitAmount: 349,
      currency: "GBP",
    },
  ],
  subtotal: 349,
  shipping: 0,
  discount: 0,
  appliedOffers: [],
  discountCode: null,
  total: 349,
  currency: "GBP",
};

const orderRow = {
  id: "order-1",
  number: "MOMO-2026-0014",
  userId: "user-1",
  email: "buyer@example.com",
  status: "processing",
  items: pendingRow.items,
  subtotal: 349,
  shipping: 0,
  discount: 0,
  appliedOffers: [],
  discountCode: null,
  total: 349,
  currency: "GBP",
  stripeSessionId: "cs_test_123",
  stripePaymentIntentId: "pi_test_123",
  createdAt: new Date("2026-10-01T10:00:00.000Z"),
};

/** A Prisma-style unique-constraint error (P2002). */
const uniqueError = (target: string[]) =>
  Object.assign(new Error("Unique constraint failed"), {
    code: "P2002",
    meta: { target },
  });

async function load() {
  return import("@/features/orders/checkout-finalize");
}

beforeEach(() => {
  m.calls.length = 0;
  m.updateMany.mockReset().mockImplementation(async () => {
    m.calls.push("claim");
    return { count: 1 };
  });
  m.findUniqueOrThrow.mockReset().mockResolvedValue(pendingRow);
  m.orderCreate.mockReset().mockImplementation(async () => {
    m.calls.push("create");
    return orderRow;
  });
  m.executeRaw.mockReset().mockImplementation(async () => {
    m.calls.push("lock");
    return 1;
  });
  m.queryRaw.mockReset().mockImplementation(async () => {
    m.calls.push("max");
    return [{ max: 13 }];
  });
});

describe("finalizeCheckout", () => {
  it("is a no-op without a pendingCheckoutId (touches nothing)", async () => {
    const { finalizeCheckout } = await load();
    const result = await finalizeCheckout(session({ metadata: {} }));

    expect(result).toBeNull();
    expect(m.updateMany).not.toHaveBeenCalled();
    expect(m.orderCreate).not.toHaveBeenCalled();
  });

  it("claims the pending row (reserved -> completed) BEFORE creating the order", async () => {
    const { finalizeCheckout } = await load();
    const order = await finalizeCheckout(session());

    expect(m.updateMany).toHaveBeenCalledWith({
      where: { id: PENDING_ID, status: "reserved" },
      data: { status: "completed" },
    });
    expect(m.calls.indexOf("claim")).toBeLessThan(m.calls.indexOf("create"));
    expect(order?.number).toBe("MOMO-2026-0014");
    expect(order?.stripeSessionId).toBe("cs_test_123");
  });

  it("creates the order from the pending payload and Stripe ids", async () => {
    const { finalizeCheckout } = await load();
    await finalizeCheckout(session());

    expect(m.orderCreate).toHaveBeenCalledTimes(1);
    const { data } = m.orderCreate.mock.calls[0][0] as {
      data: Record<string, unknown>;
    };
    expect(data).toMatchObject({
      userId: "user-1",
      email: "buyer@example.com",
      status: "processing",
      total: 349,
      currency: "GBP",
      stripeSessionId: "cs_test_123",
      stripePaymentIntentId: "pi_test_123",
    });
  });

  it("returns null and creates nothing when the claim matches 0 rows (already finalized/released)", async () => {
    m.updateMany.mockResolvedValue({ count: 0 });
    const { finalizeCheckout } = await load();

    expect(await finalizeCheckout(session())).toBeNull();
    expect(m.orderCreate).not.toHaveBeenCalled();
  });

  it("treats a unique violation on stripe_session_id as already finalized (no throw)", async () => {
    m.orderCreate.mockRejectedValue(uniqueError(["stripe_session_id"]));
    const { finalizeCheckout } = await load();

    await expect(finalizeCheckout(session())).resolves.toBeNull();
  });

  it("rethrows a unique violation on any other column so Stripe retries", async () => {
    m.orderCreate.mockRejectedValue(uniqueError(["number"]));
    const { finalizeCheckout } = await load();

    await expect(finalizeCheckout(session())).rejects.toMatchObject({
      code: "P2002",
    });
  });

  it("rethrows unexpected errors", async () => {
    m.orderCreate.mockRejectedValue(new Error("connection reset"));
    const { finalizeCheckout } = await load();

    await expect(finalizeCheckout(session())).rejects.toThrow(
      "connection reset",
    );
  });

  it("creates exactly one order when the webhook and return page finalize concurrently", async () => {
    // Model the row lock: the first updateMany flips reserved -> completed; the
    // second sees it already completed and matches 0 rows.
    let status = "reserved";
    m.updateMany.mockImplementation(
      async ({ where }: { where: { status: string } }) => {
        if (status === where.status) {
          status = "completed";
          await Promise.resolve();
          return { count: 1 };
        }
        return { count: 0 };
      },
    );

    const { finalizeCheckout } = await load();
    const [webhook, returnPage] = await Promise.all([
      finalizeCheckout(session()),
      finalizeCheckout(session()),
    ]);

    expect(m.orderCreate).toHaveBeenCalledTimes(1);
    // Exactly one caller receives the order (and therefore sends the emails).
    expect([webhook, returnPage].filter(Boolean)).toHaveLength(1);
  });
});

describe("nextOrderNumber", () => {
  const year = new Date().getFullYear();
  const tx = () =>
    ({
      $executeRaw: (...a: unknown[]) => m.executeRaw(...a),
      $queryRaw: (...a: unknown[]) => m.queryRaw(...a),
    }) as never;

  it("takes the advisory lock BEFORE reading the current max", async () => {
    const { nextOrderNumber } = await load();
    await nextOrderNumber(tx());

    expect(m.calls).toEqual(["lock", "max"]);
  });

  it("returns max + 1, zero-padded, for the current year", async () => {
    m.queryRaw.mockResolvedValue([{ max: 13 }]);
    const { nextOrderNumber } = await load();

    expect(await nextOrderNumber(tx())).toBe(`MOMO-${year}-0014`);
  });

  it("starts at 0001 when there are no orders this year", async () => {
    m.queryRaw.mockResolvedValue([{ max: null }]);
    const { nextOrderNumber } = await load();

    expect(await nextOrderNumber(tx())).toBe(`MOMO-${year}-0001`);
  });

  it("does not reuse a number after a deletion (uses max, not a row count)", async () => {
    // e.g. orders 1..9 exist plus 20; a count-based scheme would yield 0011.
    m.queryRaw.mockResolvedValue([{ max: 20 }]);
    const { nextOrderNumber } = await load();

    expect(await nextOrderNumber(tx())).toBe(`MOMO-${year}-0021`);
  });
});
