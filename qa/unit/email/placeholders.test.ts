import { describe, expect, it } from "vitest"
import {
  PLACEHOLDERS,
  findPlaceholderKeys,
  insertAtSelection,
  placeholderSamples,
  suggestPlaceholder,
  unknownPlaceholders,
} from "@/features/email/lib/domain/content/placeholders"

describe("placeholder registry", () => {
  it("has unique keys, each with a label, group and sample", () => {
    const keys = PLACEHOLDERS.map((p) => p.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const p of PLACEHOLDERS) {
      expect(p.label).toBeTruthy()
      expect(p.group).toBeTruthy()
      expect(p.sample).toBeTruthy()
    }
  })

  it("exposes samples as a key -> value map", () => {
    const samples = placeholderSamples()
    expect(samples.customer_name).toBe("Ada Lovelace")
    expect(Object.keys(samples)).toHaveLength(PLACEHOLDERS.length)
  })

  it("lets callers override samples (e.g. brand name)", () => {
    expect(placeholderSamples({ brand_name: "Acme" }).brand_name).toBe("Acme")
  })
})

describe("findPlaceholderKeys", () => {
  it("returns unique keys in order, tolerating inner spaces", () => {
    expect(findPlaceholderKeys("Hi {{ customer_name }}, order {{order_number}} {{customer_name}}")).toEqual([
      "customer_name",
      "order_number",
    ])
  })

  it("returns nothing for plain text", () => {
    expect(findPlaceholderKeys("Hello there")).toEqual([])
  })
})

describe("insertAtSelection", () => {
  it("inserts at the caret and moves the caret after the insert", () => {
    expect(insertAtSelection("Hi !", 3, 3, "{{customer_name}}")).toEqual({
      value: "Hi {{customer_name}}!",
      caret: 20,
    })
  })

  it("replaces a selected range", () => {
    expect(insertAtSelection("Hi NAME!", 3, 7, "{{customer_name}}").value).toBe("Hi {{customer_name}}!")
  })

  it("appends when no selection is known", () => {
    expect(insertAtSelection("Hi", null, null, "{{brand_name}}")).toEqual({ value: "Hi{{brand_name}}", caret: 16 })
  })

  it("clamps out-of-range positions", () => {
    expect(insertAtSelection("ab", 10, 99, "X").value).toBe("abX")
  })
})

describe("typo detection", () => {
  it("suggests the closest known placeholder for a near miss", () => {
    expect(suggestPlaceholder("fist_name")).toBeNull()
    expect(suggestPlaceholder("custmer_name")).toBe("customer_name")
    expect(suggestPlaceholder("order_numbr")).toBe("order_number")
  })

  it("returns null when nothing is close", () => {
    expect(suggestPlaceholder("completely_unrelated_thing")).toBeNull()
  })

  it("flags unknown placeholders with suggestions and ignores known ones", () => {
    expect(unknownPlaceholders("Hi {{custmer_name}}, {{order_number}} {{zzz}}")).toEqual([
      { key: "custmer_name", suggestion: "customer_name" },
      { key: "zzz", suggestion: null },
    ])
  })

  it("finds nothing wrong in correct copy", () => {
    expect(unknownPlaceholders("Order confirmed — {{order_number}}")).toEqual([])
  })
})
