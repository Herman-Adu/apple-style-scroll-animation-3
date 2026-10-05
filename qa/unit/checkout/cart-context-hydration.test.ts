import { describe, expect, it } from "vitest";

import { rehydrateCartLines } from "@/features/checkout/components/cart-context";
import { products } from "@/features/products";

describe("rehydrateCartLines", () => {
  it("rehydrates valid stored lines from JSON", () => {
    const raw = JSON.stringify([
      { slug: products[0].slug, color: "Black", quantity: 2 },
    ]);
    const lines = rehydrateCartLines(raw, products);

    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      color: "Black",
      quantity: 2,
      product: { slug: products[0].slug },
    });
  });

  it("drops unknown products and invalid quantities", () => {
    const raw = JSON.stringify([
      { slug: "missing", color: "Black", quantity: 1 },
      { slug: products[0].slug, color: "Black", quantity: 0 },
      { slug: products[0].slug, color: "Silver", quantity: 1 },
    ]);

    const lines = rehydrateCartLines(raw, products);
    expect(lines).toHaveLength(1);
    expect(lines[0].color).toBe("Silver");
  });

  it("returns an empty cart for malformed payloads", () => {
    expect(rehydrateCartLines("{not-json}", products)).toEqual([]);
  });
});
