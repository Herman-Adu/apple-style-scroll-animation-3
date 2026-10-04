import { describe, expect, it } from "vitest";

import {
  createOrderAction,
  updateOrderStatusAction,
  addTrackingAction,
  listMyOrdersAction,
  listAllOrdersAction,
} from "@/features/orders/lib/actions/orders";

describe("orders actions exports", () => {
  it("exports main server actions", () => {
    expect(typeof createOrderAction).toBe("function");
    expect(typeof updateOrderStatusAction).toBe("function");
    expect(typeof addTrackingAction).toBe("function");
    expect(typeof listMyOrdersAction).toBe("function");
    expect(typeof listAllOrdersAction).toBe("function");
  });
});
