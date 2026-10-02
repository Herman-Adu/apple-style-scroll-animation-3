import { describe, expect, it } from "vitest"
import { compare, measure } from "@/scripts/lib/arch-audit-metrics.mjs"

const file = (path: string, ...lines: string[]) => ({ path, text: lines.join("\n") })

describe("arch-audit measure", () => {
  it("counts a deep import from outside the slice but not from inside it", () => {
    const m = measure([
      file("app/page.tsx", 'import { x } from "@/features/cart/components/x"'),
      file("features/cart/a.ts", 'import { y } from "@/features/cart/lib/y"'),
      file("app/ok.tsx", 'import { z } from "@/features/cart"'),
    ])
    expect(m.deepImports).toBe(1)
  })

  it("counts lib → features inversions", () => {
    const m = measure([file("lib/a.ts", 'import { a } from "@/features/cart"'), file("app/b.ts", 'import { a } from "@/features/cart"')])
    expect(m.libToFeatures).toBe(1)
  })

  it("counts useEffect calls, any types and ++ counters", () => {
    const m = measure([
      file("features/a.tsx", "useEffect(() => {}, [])", "useEffect(() => {})", "const v: any = 1", "const w = x as any"),
      file("lib/ids.ts", "let n = 0", "export const id = () => ++n", "for (let i = 0; i < 3; i++) {}"),
    ])
    expect(m.useEffect).toBe(2)
    expect(m.anyTypes).toBe(2)
    expect(m.incrementers).toBe(2)
  })

  it("counts client components and files over 300 lines", () => {
    const long = Array.from({ length: 301 }, () => "x").join("\n")
    const m = measure([file("components/a.tsx", '"use client"', "x"), { path: "features/big.ts", text: long }])
    expect(m.clientComponents).toBe(1)
    expect(m.largeFiles).toBe(1)
  })
})

describe("arch-audit compare", () => {
  it("passes when every metric is equal or better", () => {
    expect(compare({ useEffect: 5, anyTypes: 3 }, { useEffect: 4, anyTypes: 3 })).toEqual([])
  })

  it("reports each metric that got worse", () => {
    expect(compare({ useEffect: 5, anyTypes: 3 }, { useEffect: 6, anyTypes: 3 })).toEqual([{ metric: "useEffect", baseline: 5, now: 6 }])
  })
})
